'use strict';

var webdriver = require('selenium-webdriver');
var regions = require('./regions.json');
regions = require('./create-locators')(regions);

function TodoDriver(seleniumDriver) {
  this.seleniumDriver = seleniumDriver;
}

module.exports = TodoDriver;

TodoDriver.prototype.create = function(title) {
  var seleniumDriver = this.seleniumDriver;

  return this.seleniumDriver.findElement(regions.newTodo)
    .then(function(inputElement) {
      return inputElement.sendKeys(title, webdriver.Key.ENTER);
    }).then(function() {
      return seleniumDriver.wait(function() {
        return seleniumDriver.findElement(regions.newTodo)
          .then(function(inputElement) {
            return inputElement.getAttribute('value');
          }).then(function(inputValue) {
            return inputValue === '';
          });
      });
    });
};

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
TodoDriver.prototype.readItem = function(index) {
  return this.seleniumDriver.findElements(regions.todoItem.container)
    .then(function(todoItems) {
      return todoItems[index].getText();
    });
};

TodoDriver.prototype.countRemaining = function() {
  return this.seleniumDriver.findElement(regions.count)
    .then(function(todoCount) {
      return todoCount.getText();
    }, function() {
      throw new Error(
        'Could not find "Remaining Items" label', regions.count
      );
    }).then(function(countText) {
      var match = countText.match(/(\d+)/);

      if (match === null) {
        throw new Error(
          'Could not find numeric value in "Remaing Items" label'
        );
      }

      return match[1];
    });
};
