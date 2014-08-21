'use strict';

var assert = require('assert');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('chromedriver');

var makeSelector = webdriver.By.css;
var keys = webdriver.Key;
var port = process.env.NODE_TEST_PORT || 8002;

function createItem() {
  // this will run before the tests in this `describe` block
  var driver = this.driver;
  return driver.findElement(makeSelector('#new-todo'))
    .then(function(textInput) {
      return textInput.sendKeys('clean Batmobile', keys.ENTER);
    });
}

before(function(done) {
  require('./server')(__dirname + '/..', port, done);
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromeDriver.path).build()
  );
});

beforeEach(function() {
  this.driver = new webdriver.Builder().
     withCapabilities(webdriver.Capabilities.chrome()).
     build();

  this.timeout(0);

  return this.driver.get('http://localhost:' + port);
});

afterEach(function() {
  return this.driver.quit();
});

it('includes the application name in the page title', function() {
  this.timeout(6000);

  return this.driver.getTitle().then(function(titleText) {
    assert(/TodoMVC/.test(titleText));
  });
});

describe('item creation', function() {

  beforeEach(createItem);

  it('adds new items to the list', function() {
    var driver = this.driver;

    return driver.findElements(makeSelector('#todo-list li'))
      .then(function(items) {
        assert.equal(items.length, 1);

        return items[0].getText();
      }).then(function(text) {
        assert.equal(text, 'clean Batmobile');
      });
  });

  it('updates "items left" count when new item is added', function() {
    var driver = this.driver;

    return driver.findElement(makeSelector('#todo-count'))
      .then(function(element) {
        return element.getText();
      }).then(function(text) {
        var match = text.match(/\b(\d+)\b/);
        assert(match);
        assert.equal(match[1], '1');
      });
  });
});

describe('item modification', function() {

  beforeEach(function() {
    var driver = this.driver;
    return createItem.call(this).then(function() {
      return driver.findElement(makeSelector('#todo-list li'));
    }).then(function(newItem) {
      this.newItem = newItem;
    }.bind(this));
  });

  it('allows users to complete items', function() {
    var driver = this.driver;

    return driver.findElement(makeSelector('.toggle'))
      .then(function(toggleEl) {
        return toggleEl.click();
      }).then(function() {
        return driver.findElements(makeSelector('#todo-list .completed'))
      }).then(function(completedItems) {
        assert.equal(completedItems.length, 1);
      });
  });

  it('allows users to update item text', function() {
    var newItem = this.newItem;
    return this.driver.actions()
      .doubleClick(newItem)
      .sendKeys(keys.BACK_SPACE, ' and other things', keys.ENTER)
      .perform()
      .then(function() {
        return newItem.getText();
      }).then(function(text) {
        assert.equal(text, 'clean Batmobil and other things');
      });
  });

  describe('item deletion', function() {
    beforeEach(function() {
      var newItem = this.newItem;
      return this.driver.actions()
        .mouseMove(this.newItem)
        .perform()
        .then(function() {
          return newItem.findElement(makeSelector('.destroy'));
        }).then(function(deleteBtn) {
          return deleteBtn.click();
        })
    });

    it('removes the item from the list', function() {
      var driver = this.driver;

      return driver.findElements(makeSelector('#todo-list li'))
        .then(function(items) {
          assert.equal(items.length, 0);
        });
    });

    it('decrements the "remaining item" count', function() {
      var driver = this.driver;

      return driver.findElement(makeSelector('#todo-count'))
        .then(function(countEl) {
          return countEl.isDisplayed();
        }).then(function(isDisplayed) {
          assert(!isDisplayed);
        });
    });

  });
});
