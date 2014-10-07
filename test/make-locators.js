'use strict';
var webdriver = require('selenium-webdriver');

function makeLocators(obj) {
  var toReturn = {};

  Object.keys(obj).forEach(function(key) {
    if (typeof obj[key] === 'string') {
      toReturn[key] = webdriver.By.css(obj[key]);
    } else {
      toReturn[key] = makeLocators(obj[key]);
    }
  });

  return toReturn;
}

module.exports = makeLocators;
