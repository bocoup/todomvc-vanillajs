'use strict';

var assert = require('assert');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('chromedriver');

var locators = require('./make-locators')(require('./locators.json'));
var port = process.env.NODE_TEST_PORT || 8002;

before(function(done) {
  require('./server')(__dirname + '/..', port, done);
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromeDriver.path).build()
  );
});

beforeEach(function() {
  var driver = this.driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.firefox())
    .build();

  this.timeout(10 * 1000);

  return driver.get('http://localhost:' + port);
});

afterEach(function() {
  return this.driver.quit();
});

it('displays the correct page title', function() {
  this.timeout(8000);
  return this.driver.getTitle()
    .then(function(pageTitle) {
      assert.equal(pageTitle, 'VanillaJS • TodoMVC');
    });
});

describe('item creation', function() {
  beforeEach(function() {
    var driver = this.driver;
    return this.driver.findElement(locators.newTodoInput)
      .then(function(el) {
        return el.sendKeys('order new SSD', webdriver.Key.ENTER);
      }).then(function() {
        return driver.wait(function() {
          // 1. get element
          return driver.findElement(locators.newTodoInput)
            .then(function(el) {
              // 2. get element text
              return el.getAttribute('value');
            }).then(function(text) {
              // 3. resolve with `true` if text is empty (the waiting is over).
              //    Otherwise, resolve with `false`
              return text === '';
            });
        });
      });
  });

  it('appends new list items to Todo list', function() {
    var driver = this.driver;

    return driver.findElement(locators.todoItem.label)
      .then(function(el) {
        return el.getText();
      }).then(function(text) {
        assert.equal(text, 'order new SSD');
      });
  });

  it('updates the "Remaining Items" counter', function() {
    var driver = this.driver;

    return driver.findElement(locators.todoCount)
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
    var driver = this.driver;

    return this.driver.findElement(locators.newTodoInput)
      .then(function(el) {
        return el.sendKeys('order new SSD', webdriver.Key.ENTER);
      }).then(function() {
        return driver.wait(function() {
          // 1. get element
          return driver.findElement(locators.newTodoInput)
            .then(function(el) {
              // 2. get element text
              return el.getAttribute('value');
            }).then(function(text) {
              // 3. resolve with `true` if text is empty (the waiting is over).
              //    Otherwise, resolve with `false`
              return text === '';
            });
        });
      }).then(function() {
        return driver.findElement(locators.todoItem.label);
      }).then(function(el) {
        return driver.actions()
          .mouseMove(el)
          .perform();
      }).then(function() {
        // Ensure that the UI has updated in response to the "mouseover" event!
        // --> Ensure that the `destroy` element is visible
        //
        // 1. Create a promise using `driver.wait`. Inside:
        //    i.  use `findElement` to get the `.destroy` element
        //    ii. return the promise created by `isDisplayed`
        // 2. return the promise created by `wait`
        var pollingPromise = driver.wait(function() {
          return driver.findElement(locators.todoItem.destroy)
            .then(function(el) {
              return el.isDisplayed();
            }).then(function(isDisplayed) {
              return isDisplayed;
            });
        });

        return pollingPromise;
      }).then(function() {
        return driver.findElement(locators.todoItem.destroy);
      }).then(function(el) {
        return el.click();
      }).then(function() {
        // use wait to pause until the label is not present
        // methods to use: `driver.wait`, `driver.isElementPresent`
        // Don't forget: store a reference to `this.driver` in a local
        //               variable! (i.e. `var driver = this.driver;`)

        return driver.wait(function() {
          return driver.isElementPresent(locators.todoItem.label)
            .then(function(isPresent) {
              return !isPresent;
            });
        });
      });
  });

  it('removes list item from Todo list', function() {
    return this.driver.findElements(locators.todoItem.label)
      .then(function(elems) {
        assert.equal(elems.length, 0);
      });
  });
  it('hides the "Remaining Items" counter when no items remain', function() {
    return this.driver.findElement(locators.todoCount)
      .then(function(el) {
        return el.isDisplayed();
      }).then(function(isDisplayed) {
        assert.equal(isDisplayed, false);
      });
  });
});

describe('item modification', function() {
  beforeEach(function() {
    var driver = this.driver;

    return this.driver.findElement(locators.newTodoInput)
      .then(function(el) {
        return el.sendKeys('order new SSD', webdriver.Key.ENTER);
      }).then(function() {
        return driver.wait(function() {
          // 1. get element
          return driver.findElement(locators.newTodoInput)
            .then(function(el) {
              // 2. get element text
              return el.getAttribute('value');
            }).then(function(text) {
              // 3. resolve with `true` if text is empty (the waiting is over).
              //    Otherwise, resolve with `false`
              return text === '';
            });
        });
      });
  });
  it('supports task name modification', function() {
    var driver = this.driver;

    return this.driver.findElement(locators.todoItem.label)
      .then(function(newTodo) {
        return driver.actions()
          .doubleClick(newTodo)
          .sendKeys('...now!', webdriver.Key.ENTER)
          .perform();
      }).then(function() {
        return driver.wait(function() {
          return driver.userCanSee(locators.todoItem.editInput)
            .then(function(userCanSee) {
              return !userCanSee;
            });
        });
      }).then(function() {
        return driver.findElement(locators.todoItem.label);
      }).then(function(el) {
        return el.getText();
      }).then(function(todoText) {
        assert.equal(todoText, 'order new SSD...now!');
      });
  });
});

webdriver.WebDriver.prototype.userCanSee = function(locator) {
  var driver = this;

  return this.isElementPresent(locator)
    .then(function(isPresent) {
      if (isPresent === false) {
        return false;
      }
      return driver.getElement(locator)
        .then(function(el) {
          return el.isDisplayed();
        });
    });
};
