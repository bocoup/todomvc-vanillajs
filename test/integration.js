'use strict';

var assert = require('assert');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('selenium-chromedriver');

var TodoDriver = require('./todo-driver');
var regions = require('./regions.json');
var port = process.env.NODE_TEST_PORT || 8002;

regions = require('./create-locators')(regions);

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

  this.timeout(20 * 1000);

  return seleniumDriver.get('http://localhost:' + port);
});

afterEach(function() {
  return this.seleniumDriver.quit();
});

describe('item creation', function() {
  beforeEach(function() {
    return this.todoDriver.create('buy candy');
  });

  it('inserts new Todo items to Todo list', function() {
    // 1. Get input element
    // 2. Type into input element
    // 3. Get Todo list item element
    // 4. Get the text of list item element
    // 5. Make sure the text is correct (based on what we typed in #2)

    // These selectors are brittle:
    //return this.seleniumDriver.findElement(webdriver.By.css('#header input'));
    //return this.seleniumDriver.findElement(
    //  webdriver.By.css('html body section header input')
    //);
    return this.seleniumDriver.findElement(regions.todoItem.container)
      .then(function(todoItem) {
        return todoItem.getText();
      }).then(function(todoText) {
        assert.equal(todoText, 'buy candy');
      });
  });

  it('updates the counter for remaining items when a new Todo item is created', function() {
    // 1. Get input element
    // 2. Type into input element
    // 3. Get "remaining item count" element
    // 4. Get the text of "remaining item count" element
    // 5. Make sure the text is correct

    return this.seleniumDriver.findElement(regions.count)
      .then(function(todoCount) {
        return todoCount.getText();
      }).then(function(count) {
        var match = count.match(/(\d+)/);

        assert.ok(match, 'Counter contains decimal number');
        assert.strictEqual(match[1], '1');
      });
  });

});

describe('item deletion', function() {
  beforeEach(function() {
    var seleniumDriver = this.seleniumDriver;

    return this.todoDriver.create('buy candy')
      .then(function() {
        return seleniumDriver.findElement(regions.todoItem.container);
      }).then(function(todoItem) {
        return seleniumDriver.actions()
          .mouseMove(todoItem)
          .perform();
      }).then(function() {
        return seleniumDriver.wait(function() {
          return seleniumDriver.findElement(regions.todoItem.destroyBtn)
            .then(function(destroyBtn) {
              return destroyBtn.isDisplayed();
            });
        });
      }).then(function() {
        return seleniumDriver.findElement(regions.todoItem.destroyBtn);
      }).then(function(destroyBtn) {
        return destroyBtn.click();
      }).then(function() {
        return seleniumDriver.wait(function() {
          return seleniumDriver.findElements(regions.todoItem.container)
            .then(function(todoItems) {
              return todoItems.length === 0;
            });
        });
      });
  });

  it('removes item from Todo list', function() {
    // 1. `seleniumDriver.findElement` to get the Todo item from the Todo list
    // 2. `seleniumDriver.actions().mouseMove(todoItemElement).perform()`
    // 3. `findelement` to get the delete button
    // 4. `WebElement#click()`
    // 5. `seleniumDriver.findElements()` to get the Todo items
    // 6. Make sure there are none!
    var seleniumDriver = this.seleniumDriver;

    return seleniumDriver.findElements(regions.todoItem.container)
      .then(function(todoItems) {
        assert.equal(todoItems.length, 0);
      });
  });

  it('hides the counter', function() {
    //return this.seleniumDriver.findElement(webdriver.By.css('#todo-count'))
    //  .then(function(todoCount) {
    //    return todoCount.isDisplayed();
    //  }).then(function(isDisplayed) {
    //    assert.equal(isDisplayed, false);
    //  });

    // Some might say the above approach is brittle because it will fail if the
    // application is updated to remove the "Todo count" element (instead of
    // just hiding it). You might define a generic `canUserSee` method to
    // account for *both* cases (be careful, though: this method is susceptible
    // to false positives).
    return this.seleniumDriver.canUserSee(regions.count)
      .then(function(userCanSee) {
        assert.equal(userCanSee, false);
      });
  });
});

/**
 * Check if the user can see the element at the given locator. First, check if
 * it is present in the document. If it is not, resolve with `false`. If the
 * element *is* in the document, check if it is displayed. If the element is
 * not displayed, resolve with `false`. If it is displayed, resolve with
 * `true`.
 *
 * @param {webdriver.WebDriver} seleniumDriver
 * @param {webriver.Locator} locator
 *
 * @return {Promise} resolved with whether the user can see the specified
 *                   element or not
 */
webdriver.WebDriver.prototype.canUserSee = function(locator) {
  var seleniumDriver = this;
  return this.isElementPresent(locator)
    .then(function(isPresent) {
      if (!isPresent) {
        return false;
      }

      return seleniumDriver.findElement(locator)
        .then(function(element) {
          return element.isDisplayed();
        });
    });
};

describe('item updating', function() {
  beforeEach(function() {
    var seleniumDriver = this.seleniumDriver;

    return this.todoDriver.create('buy candy');
  });

  it('supports renaming', function() {
    var seleniumDriver = this.seleniumDriver;

    // 1. `seleniumDriver.findElement` to get the Todo list item element
    // 2. `seleniumDriver.actions().doubleClick().sendKeys()` to update the text
    // 3. `seleniumDriver.findElement` to get the Todo list item element
    // 4. `getText` to get the text
    // 5. `assert.equal` to verify that the text has been updated correctly
    return seleniumDriver.findElement(regions.todoItem.label)
      .then(function(todoLabel) {
        return seleniumDriver.actions()
          .doubleClick(todoLabel)
          .sendKeys(' tonight! Calaveras, preferably', webdriver.Key.ENTER)
          .perform();
      }).then(function() {
        return seleniumDriver.wait(function() {
          return seleniumDriver.isElementPresent(regions.todoItem.editing)
            .then(function(isPresent) {
              return !isPresent;
            });
        });
      }).then(function() {
        return seleniumDriver.findElement(regions.todoItem.label);
      }).then(function(todoLabel) {
        return todoLabel.getText();
      }).then(function(todoText) {
        assert.equal(todoText, 'buy candy tonight! Calaveras, preferably');
      });
  });

  it('supports task completion', function() {
    var seleniumDriver = this.seleniumDriver;
    // 1. `seleniumDriver.findElement` to get the Todo list item checkbox
    // 2. `seleniumDriver.actions.click` to complete the task
    // 3. `seleniumDriver.findElements` to get an array of all *completed* tasks
    // 4. `assert.equal` to verify that there are the correct number of
    //    completed tasks
    return seleniumDriver.findElement(regions.todoItem.toggle)
      .then(function(checkbox) {
        return checkbox.click();
      }).then(function() {
        return seleniumDriver.wait(function() {
          return seleniumDriver.findElement(regions.todoItem.toggle)
            .then(function(checkbox) {
              return checkbox.getAttribute('checked');
            }).then(function(value) {
              return value === 'true';
            });
        });
      }).then(function() {
        return seleniumDriver.findElements(regions.todoItem.completed);
      }).then(function(completedListItems) {
        assert.equal(completedListItems.length, 1);
      });
  });
});
