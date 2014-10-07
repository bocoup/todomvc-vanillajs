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
