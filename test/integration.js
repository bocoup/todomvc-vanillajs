'use strict';

var assert = require('assert');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('selenium-chromedriver');

var port = process.env.NODE_TEST_PORT || 8002;

var TodoDriver = require('./todo-driver');

before(function(done) {
  require('./server')(__dirname + '/..', port, done);
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromeDriver.path).build()
  );
});

beforeEach(function() {
  var timeout = 20000;
  var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

  this.timeout(timeout);

  driver.manage().timeouts().implicitlyWait(1000);

  this.todoDriver = new TodoDriver(driver, port);

  return this.todoDriver.navigate();
});

afterEach(function() {
  return this.todoDriver.quit();
});

describe('Creation', function(done) {
  beforeEach(function() {
    return this.todoDriver.add('buy stapler');
  });

  it('appends a list item', function() {
    return this.todoDriver.readItem(0)
      .then(function(text) {
        assert.equal(text, 'buy stapler');
      });
  });

  it('updates the remaining item count', function() {
    return this.todoDriver.readCount()
      .then(function(count) {
        assert.equal(count, 1);
      });
  });

  it('persists tasks across page refreshes', function() {
    var todoDriver = this.todoDriver;

    return todoDriver.refresh()
      .then(function() {
        return todoDriver.readItem(0)
      }).then(function(text) {
        assert.equal(text, 'buy stapler');
      });
  });
});

describe('Deletion', function() {
  beforeEach(function() {
    var todoDriver = this.todoDriver;

    return todoDriver.add('buy stapler')
      .then(function() {
        return todoDriver.remove(0);
      });
  });

  it('removes the list item', function() {
    return this.todoDriver.countItems()
      .then(function(count) {
        assert.equal(count, 0);
      });
  });

  it('hides the remaining item count', function() {
    return this.todoDriver.isCountDisplayed()
      .then(function(isDisplayed) {
        assert(!isDisplayed);
      });
  });
});

describe('Updating', function() {
  beforeEach(function() {
    return this.todoDriver.add('buy stapler');
  });

  it('supports task name modification', function() {
    var todoDriver = this.todoDriver;

    return todoDriver.edit(0, webdriver.Key.BACK_SPACE, 'e')
      .then(function() {
        return todoDriver.readItem(0);
      }).then(function(text) {
        assert.equal(text, 'buy staplee');
      });
  });

  describe('task completion', function() {
    beforeEach('supports task completion', function() {
      var todoDriver = this.todoDriver;

      return todoDriver.toggle(0)
        .then(function() {
          return todoDriver.countItems('completed');
        }).then(function(count) {
          assert.equal(count, 1);
        });
    });

    it('updates the remaining item count', function() {
      return this.todoDriver.readCount()
        .then(function(count) {
          assert.equal(count, 0);
        });
    });
  });
});
