'use strict';

var webdriver = require('selenium-webdriver');
function makeSelectors(obj) {
  var selectors = {};

  Object.keys(obj).forEach(function(key) {
    var value = obj[key];
    if (typeof value === 'string') {
      selectors[key] = webdriver.By.css(value);
    } else {
      selectors[key] = makeSelectors(value);
    }
  });

  return selectors;
}
var selectors = makeSelectors(require('./selectors.json'));

function TodoDriver(driver, port) {
    this._driver = driver;
    this._port = port;
}

module.exports = TodoDriver;

/**
 * Open the application index page.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.navigate = function() {
  return this._driver.get('http://localhost:' + this._port);
};

/**
 * Refresh the current page.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.refresh = function() {
  var driver = this._driver;

  return driver.getCurrentUrl()
    .then(function(url) {
      return driver.get(url);
    });
};

/**
 * Create a new todo item.
 *
 * @param {String|webdriver.Key} text The keys to press when editing the item.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.add = function(text) {
  return this._driver.findElement(selectors.create)
    .sendKeys(text, webdriver.Key.ENTER);
};

/**
 * Change the text of a todo list item.
 *
 * @param {Number} [index] The offset of the todo list item that should be
 *                         changed. Defaults to `0`.
 * @param {String|webdriver.Key} [args...] Any number of keys to press when
 *                                         editing the item.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.edit = function(index) {
  var driver= this._driver;
  var keys = Array.prototype.slice.call(arguments, 1);
  keys.push(webdriver.Key.ENTER);

  index = index || 0;

  return driver.findElements(selectors.item.container)
    .then(function(elems) {
      var action = driver.actions()
        .doubleClick(elems[index]);
      return action.sendKeys.apply(action, keys).perform();
    });
};

/**
 * Remove a todo from the list.
 *
 * @param {Number} [index] The offset of the todo list item that should be
 *                         removed. Defaults to `0`.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.remove = function(index) {
  var driver = this._driver;
  index = index || 0;

  return driver.findElements(selectors.item.container)
    .then(function(elems) {
      var target = elems[index];

      return driver.actions()
        .mouseMove(target)
        .perform()
        .then(function() {
          return target.findElement(selectors.item.destroy).click();
        });
    });
};

/**
 * Mark an incomplete todo item as "complete" and vice versa.
 *
 * @param {Number} [index] The offset of the todo list item that should be
 *                         toggled. Defaults to `0`.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.toggle = function(index) {
  index = index || 0;

  return this._driver.findElements(selectors.item.toggle)
    .then(function(elems) {
      return elems[index].click();
    });
};

/**
 * Get the number of todo list items currently rendered in the todo list.
 *
 * @param {String} [filter] The type of item to count. May be specified as
 *                          "completed" (to count only completed todo list
 *                          items) or unspecified (to count all todo list
 *                          items).
 *
 * @returns {Promise<Number>}
 */
TodoDriver.prototype.countItems = function(filter) {
  var selector = selectors.item[
    filter === 'completed' ? 'completed' : 'container'
  ];

  return this._driver.findElements(selector)
    .then(function(elems) {
      return elems.length;
    });
};

/**
 * Get the text rendered in the todo list item at the given index.
 *
 * @param {Number} [index] The offset of the todo list item that should be
 *                         read. Defaults to `0`.
 *
 * @returns {Promise<String>}
 */
TodoDriver.prototype.readItem = function(index) {
  index = index || 0;

  return this._driver.findElements(selectors.item.container)
    .then(function(els) {
      var length = els.length;
      var todoStr;

      if (index >= length) {
        throw new Error(
          'Attempted to read Todo item at ' + index + ', but only ' + length +
          ' todo' + (length === 1 ? '' : 's') + ' were found'
        );
      }
      return els[index].getText();
    });
};

/**
 * Get the integer rendered in the interface describing the number of todo
 * items currently displayed.
 *
 * @returns {Promise<Number>}
 */
TodoDriver.prototype.readCount = function() {
  return this._driver.findElement(selectors.count)
    .getText()
    .then(function(text) {
      var match = text.match(/^\s*(\d+)\s*items?\s*left\s*$/i);

      if (!match) {
        throw new Error(
          'Current Todo count not recognized. Text: "' + text + '"'
        );
      }
      return parseInt(match[1], 10);
    });
};

/**
 * Determine whether the "todo count" element is displayed.
 *
 * @returns {Promise<Boolean>}
 */
TodoDriver.prototype.isCountDisplayed = function() {
  return this._driver.findElement(selectors.count).isDisplayed();
};

/**
 * Quit the current browsing session. The Todo instance will no longer be valid
 * after this command completes.
 *
 * @returns {Promise}
 */
TodoDriver.prototype.quit = function() {
  return this._driver.quit();
};
