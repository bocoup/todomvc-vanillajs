var webdriver = require('selenium-webdriver');

module.exports = function createLocators(selectors) {
  var locators = {};
  var attr;

  for (attr in selectors) {
    if (typeof selectors[attr] === 'string') {
      locators[attr] = webdriver.By.css(selectors[attr]);
    } else {
      locators[attr] = createLocators(selectors[attr]);
    }
  }

  return locators;
};
