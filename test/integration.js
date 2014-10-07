'use strict';

var assert = require('assert');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('chromedriver');

var TodoDriver = require('./todo-driver');
var locators = require('./make-locators')(require('./locators.json'));
var port = process.env.NODE_TEST_PORT || 8002;

before(function(done) {
  require('./server')(__dirname + '/..', port, done);
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromeDriver.path).build()
  );
});

beforeEach(function() {
  var seleniumDriver = this.seleniumDriver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.firefox())
    .build();
  var todoDriver = this.todoDriver = new TodoDriver(seleniumDriver);

  this.timeout(10 * 1000);

  return seleniumDriver.get('http://localhost:' + port);
});

afterEach(function() {
  return this.seleniumDriver.quit();
});

it('displays the correct page title', function() {
  this.timeout(8000);
  return this.seleniumDriver.getTitle()
    .then(function(pageTitle) {
      assert.equal(pageTitle, 'VanillaJS • TodoMVC');
    });
});

describe('item creation', function() {
  beforeEach(function() {
    return this.todoDriver.create('order new SSD');
  });

  it('appends new list items to Todo list', function() {
    return this.todoDriver.readItem(0)
      .then(function(text) {
        assert.equal(text, 'order new SSD');
      });
  });

  it('inserts new items at the end of the list', function() {
    var todoDriver = this.todoDriver;
    return this.todoDriver.create('this is a new one')
      .then(function() {
        return todoDriver.readItem(1);
      }).then(function(text) {
        assert.equal(text, 'this is a new one');
      });
  });

  it('updates the "Remaining Items" counter', function() {
    var seleniumDriver = this.seleniumDriver;

    return seleniumDriver.findElement(locators.todoCount)
      .then(function(el) {
        return el.getText();
      }).then(function(text) {
        var remainingRe = /(\d+)/;
        var match = text.match(remainingRe);

        assert(match, '"Remaining Items" contains a number');
        assert.equal(match[1], '1');
      });
  });
});

describe('item deletion', function() {
  beforeEach(function() {
    var seleniumDriver = this.seleniumDriver;
    var todoDriver = this.todoDriver;

    return this.todoDriver.create('order new SSD')
      .then(function() {
        return todoDriver.delete(0);
      });
  });

  it('removes list item from Todo list', function() {
    return this.todoDriver.countItems()
      .then(function(itemCount) {
        assert.equal(itemCount, 0);
      });
  });
  it('hides the "Remaining Items" counter when no items remain', function() {
    return this.seleniumDriver.findElement(locators.todoCount)
      .then(function(el) {
        return el.isDisplayed();
      }).then(function(isDisplayed) {
        assert.equal(isDisplayed, false);
      });
  });
});

describe('item modification', function() {
  beforeEach(function() {
    var seleniumDriver = this.seleniumDriver;

    return this.todoDriver.create('order new SSD');
  });
  it('supports task name modification', function() {
    var seleniumDriver = this.seleniumDriver;
    var todoDriver = this.todoDriver;

    return this.seleniumDriver.findElement(locators.todoItem.label)
      .then(function(newTodo) {
        return seleniumDriver.actions()
          .doubleClick(newTodo)
          .sendKeys('...now!', webdriver.Key.ENTER)
          .perform();
      }).then(function() {
        return seleniumDriver.wait(function() {
          return seleniumDriver.userCanSee(locators.todoItem.editInput)
            .then(function(userCanSee) {
              return !userCanSee;
            });
        });
      }).then(function() {
        return todoDriver.readItem(0);
      }).then(function(todoText) {
        assert.equal(todoText, 'order new SSD...now!');
      });
  });
});

describe.only('congrats', function() {
  beforeEach(function() {
    var todoDriver = this.todoDriver;

    return todoDriver.create('first')
      .then(function() {
        return todoDriver.create('second');
      }).then(function() {
        return todoDriver.create('third');
      }).then(function() {
        return todoDriver.complete(2);
      }).then(function() {
        return todoDriver.complete(0);
      }).then(function() {
        return todoDriver.isCongratulating();
      }).then(function(isCongratulating) {
        assert.equal(isCongratulating, false);
      });
  });

  it('should congratulate user when they complete the last item', function() {
    var todoDriver = this.todoDriver;

    return todoDriver.complete(1)
      .then(function() {
        return todoDriver.isCongratulating();
      }).then(function(isCongratulating) {
        assert(isCongratulating);
      });
  });

  it('should congratulate user when they remove the last item', function() {
    var todoDriver = this.todoDriver;

    return todoDriver.delete(1)
      .then(function() {
        return todoDriver.isCongratulating();
      }).then(function(isCongratulating) {
        assert(isCongratulating);
      });
  });
});

webdriver.WebDriver.prototype.userCanSee = function(locator) {
  var seleniumDriver = this;

  return this.isElementPresent(locator)
    .then(function(isPresent) {
      if (isPresent === false) {
        return false;
      }
      return seleniumDriver.getElement(locator)
        .then(function(el) {
          return el.isDisplayed();
        });
    });
};
