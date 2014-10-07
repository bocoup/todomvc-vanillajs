'use strict';
var webdriver = require('selenium-webdriver');

function makeLocators(obj) {
  Object.keys(obj).forEach(function(key) {
    if (typeof obj[key] === 'string') {
      obj[key] = webdriver.By.css(obj[key]);
    } else {
      makeLocators(obj[key]);
    }
  });

  return obj;
}

module.exports = makeLocators;
