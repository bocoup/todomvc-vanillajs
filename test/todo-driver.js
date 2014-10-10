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
