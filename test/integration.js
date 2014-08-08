'use strict';

var assert = require('assert');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('selenium-chromedriver');

var port = process.env.NODE_TEST_PORT || 8002;

function makeSelectors(obj) {
  var selectors = {};

  Object.keys(obj).forEach(function(key) {
    var value = obj[key];
    if (typeof value === 'string') {
      selectors[key] = webdriver.By.css(value);
    } else {
      selectors[key] = makeSelectors(value);
    }
  });

  return selectors;
}
var selectors = makeSelectors(require('./selectors.json'));

before(function(done) {
  require('./server')(__dirname + '/..', port, done);
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromeDriver.path).build()
  );
});

beforeEach(function() {
  var timeout = 20000;
  var driver = this.driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

  this.timeout(timeout);

  driver.manage().timeouts().implicitlyWait(1000);

  return driver.get('http://localhost:' + port);
});

afterEach(function() {
  return this.driver.quit();
});

describe('Creation', function(done) {
  beforeEach(function() {
    return this.driver.findElement(selectors.create)
      .sendKeys('buy stapler', webdriver.Key.ENTER);
  });

  it('appends a list item', function() {
    return this.driver.findElement(selectors.item.container)
      .getText()
      .then(function(text) {
        assert.equal(text, 'buy stapler');
      });
  });

  it('updates the remaining item count', function() {
    return this.driver.findElement(selectors.count)
      .getText()
      .then(function(text) {
        assert(/1\s+item\s+left/i.test(text));
      });
  });

  it('persists tasks across page refreshes', function() {
    var driver = this.driver;

    return this.driver.getCurrentUrl()
      .then(function(url) {
        return driver.get(url);
      }).then(function() {
        driver.findElement(selectors.item.container)
          .getText()
          .then(function(text) {
            assert.equal(text, 'buy stapler');
          });
      });
  });
});

describe('Deletion', function() {
  beforeEach(function() {
    var driver = this.driver;

    return driver.findElement(selectors.create)
      .sendKeys('buy stapler', webdriver.Key.ENTER)
      .then(function() {
        return driver.findElement(selectors.item.container)
          .then(function(elem) {
            return driver.actions()
              .mouseMove(elem)
              .perform()
              .then(function() {
                return elem;
              });
          }).then(function(elem) {
            return elem.findElement(selectors.item.destroy)
              .click();
          });
      });
  });

  it('removes the list item', function() {
    return this.driver.isElementPresent(selectors.item.container)
      .then(function(isPresent) {
        assert(!isPresent);
      });
  });

  it('hides the remaining item count', function() {
    return this.driver.findElement(selectors.count)
      .isDisplayed()
      .then(function(isDisplayed) {
        assert(!isDisplayed);
      });
  });
});

describe('Updating', function() {
  beforeEach(function() {
    var ctx = this;

    return this.driver.findElement(selectors.create)
      .sendKeys('buy stapler', webdriver.Key.ENTER)
      .then(function() {
        return ctx.driver.findElement(selectors.item.container);
      })
      .then(function(elem) {
        ctx.newTodo = elem;
      });
  });

  it('supports task name modification', function() {
    var driver = this.driver;

    return driver.actions()
      .doubleClick(this.newTodo)
      .sendKeys(webdriver.Key.BACK_SPACE, 'e', webdriver.Key.ENTER)
      .perform()
      .then(function() {
        return driver.findElement(selectors.item.container)
          .getText();
      }).then(function(text) {
        assert.equal(text, 'buy staplee');
      });
  });

  describe('task completion', function() {
    beforeEach('supports task completion', function() {
      var driver = this.driver;

      return this.driver.findElement(selectors.item.toggle)
        .click()
        .then(function() {
          return driver.isElementPresent(selectors.item.completed)
            .then(function(isPresent) {
              assert(isPresent);
            });
        });
    });

    it('updates the remaining item count', function() {
      return this.driver.findElement(selectors.count)
        .getText()
        .then(function(text) {
          assert(/^\s*0 items left\s*$/i, text);
        });
    });
  });
});
