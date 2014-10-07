'use strict';
var webdriver = require('selenium-webdriver');
var locators = require('./make-locators')(require('./locators.json'));

function TodoDriver(seleniumDriver) {
  this.seleniumDriver = seleniumDriver;
}

module.exports = TodoDriver;

TodoDriver.prototype.create = function(title) {
  var seleniumDriver = this.seleniumDriver;

  return this.seleniumDriver.findElement(locators.newTodoInput)
    .then(function(el) {
      return el.sendKeys(title, webdriver.Key.ENTER);
    }).then(function() {
      return seleniumDriver.wait(function() {
        // 1. get element
        return seleniumDriver.findElement(locators.newTodoInput)
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
};

TodoDriver.prototype.readItem = function(index) {
  return this.seleniumDriver.findElements(locators.todoItem.label)
    .then(function(els) {
      return els[index].getText();
    });
};

TodoDriver.prototype.delete = function(index) {
  var seleniumDriver = this.seleniumDriver;
  var todoDriver = this;
  var initialElementCount;

  return seleniumDriver.findElements(locators.todoItem.label)
    .then(function(els) {
      return seleniumDriver.actions()
        .mouseMove(els[index])
        .perform();
    }).then(function() {
      // Ensure that the UI has updated in response to the "mouseover" event!
      // --> Ensure that the `destroy` element is visible
      //
      // 1. Create a promise using `seleniumDriver.wait`. Inside:
      //    i.  use `findElement` to get the `.destroy` element
      //    ii. return the promise created by `isDisplayed`
      // 2. return the promise created by `wait`
      var pollingPromise = seleniumDriver.wait(function() {
        return seleniumDriver.findElements(locators.todoItem.destroy)
          .then(function(els) {
            return els[index].isDisplayed();
          }).then(function(isDisplayed) {
            return isDisplayed;
          });
      });

      return pollingPromise;
    }).then(function() {
      return seleniumDriver.findElements(locators.todoItem.destroy);
    }).then(function(els) {
      initialElementCount = els.length;
      return els[index].click();
    }).then(function() {
      // use wait to pause until the label is not present
      // methods to use: `seleniumDriver.wait`, `seleniumDriver.isElementPresent`
      // Don't forget: store a reference to `this.seleniumDriver` in a local
      //               variable! (i.e. `var seleniumDriver = this.seleniumDriver;`)

      return seleniumDriver.wait(function() {
        return todoDriver.countItems()
          .then(function(count) {
            return count < initialElementCount;
          });
      });
    });
};

TodoDriver.prototype.countItems = function() {
  return this.seleniumDriver.findElements(locators.todoItem.label)
    .then(function(elems) {
      return elems.length;
    });
};

TodoDriver.prototype.complete = function(idx) {
  var seleniumDriver = this.seleniumDriver;
  var todoDriver = this;

  return this.seleniumDriver.findElements(locators.todoItem.toggle)
    .then(function(els) {
      return els[idx].click();
    }).then(function() {
      return seleniumDriver.wait(function() {
        return seleniumDriver.findElements(locators.todoItem.container)
          .then(function(items) {
            return todoDriver._hasClass(items[idx], 'completed');
          });
      });
    });
};

TodoDriver.prototype._hasClass = function(el, query) {
  return el.getAttribute('class')
    .then(function(classNameAttr) {
      return classNameAttr.split(' ').indexOf(query) > -1;
    });
};

TodoDriver.prototype.isCongratulating = function() {
  var todoDriver = this;
  return this.seleniumDriver.findElement(locators.todoList)
    .then(function(el) {
      return todoDriver._hasClass(el, 'congrats');
    });
};
