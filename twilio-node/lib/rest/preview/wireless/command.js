'use strict';

var _ = require('lodash');
var Q = require('q');
var Page = require('../../../base/Page');
var deserialize = require('../../../base/deserialize');
var values = require('../../../base/values');

var CommandPage;
var CommandList;
var CommandInstance;
var CommandContext;

/* jshint ignore:start */
/**
 * @constructor Twilio.Preview.Wireless.CommandPage
 * @augments Page
 * @description Initialize the CommandPage
 *
 * @param {Twilio.Preview.Wireless} version - Version of the resource
 * @param {object} response - Response from the API
 * @param {object} solution - Path solution
 *
 * @returns CommandPage
 */
/* jshint ignore:end */
function CommandPage(version, response, solution) {
  // Path Solution
  this._solution = solution;

  Page.prototype.constructor.call(this, version, response, this._solution);
}

_.extend(CommandPage.prototype, Page.prototype);
CommandPage.prototype.constructor = CommandPage;

/* jshint ignore:start */
/**
 * Build an instance of CommandInstance
 *
 * @function getInstance
 * @memberof Twilio.Preview.Wireless.CommandPage
 * @instance
 *
 * @param {object} payload - Payload response from the API
 *
 * @returns CommandInstance
 */
/* jshint ignore:end */
CommandPage.prototype.getInstance = function getInstance(payload) {
  return new CommandInstance(
    this._version,
    payload
  );
};


/* jshint ignore:start */
/**
 * @constructor Twilio.Preview.Wireless.CommandList
 * @description Initialize the CommandList
 *
 * @param {Twilio.Preview.Wireless} version - Version of the resource
 */
/* jshint ignore:end */
function CommandList(version) {
  /* jshint ignore:start */
  /**
   * @function commands
   * @memberof Twilio.Preview.Wireless
   * @instance
   *
   * @param {string} sid - sid of instance
   *
   * @returns {Twilio.Preview.Wireless.CommandContext}
   */
  /* jshint ignore:end */
  function CommandListInstance(sid) {
    return CommandListInstance.get(sid);
  }

  CommandListInstance._version = version;
  // Path Solution
  CommandListInstance._solution = {};
  CommandListInstance._uri = _.template(
    '/Commands' // jshint ignore:line
  )(CommandListInstance._solution);
  /* jshint ignore:start */
  /**
   * Streams CommandInstance records from the API.
   *
   * This operation lazily loads records as efficiently as possible until the limit
   * is reached.
   *
   * The results are passed into the callback function, so this operation is memory efficient.
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @function each
   * @memberof Twilio.Preview.Wireless.CommandList
   * @instance
   *
   * @param {object|function} opts - ...
   * @param {string} [opts.device] - The device
   * @param {string} [opts.status] - The status
   * @param {string} [opts.direction] - The direction
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         each() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize=50] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no pageSize is defined but a limit is defined,
   *         each() will attempt to read the limit with the most efficient
   *         page size, i.e. min(limit, 1000)
   * @param {Function} [opts.callback] -
   *         Function to process each record. If this and a positional
   * callback are passed, this one will be used
   * @param {Function} [opts.done] -
   *          Function to be called upon completion of streaming
   * @param {Function} [callback] - Function to process each record
   */
  /* jshint ignore:end */
  CommandListInstance.each = function each(opts, callback) {
    opts = opts || {};
    if (_.isFunction(opts)) {
      opts = { callback: opts };
    } else if (_.isFunction(callback) && !_.isFunction(opts.callback)) {
      opts.callback = callback;
    }

    if (_.isUndefined(opts.callback)) {
      throw new Error('Callback function must be provided');
    }

    var done = false;
    var currentPage = 1;
    var limits = this._version.readLimits({
      limit: opts.limit,
      pageSize: opts.pageSize
    });

    function onComplete(error) {
      done = true;
      if (_.isFunction(opts.done)) {
        opts.done(error);
      }
    }

    function fetchNextPage(fn) {
      var promise = fn();
      if (_.isUndefined(promise)) {
        onComplete();
        return;
      }

      promise.then(function(page) {
        _.each(page.instances, function(instance) {
          if (done) {
            return false;
          }

          opts.callback(instance, onComplete);
        });

        if ((limits.pageLimit && limits.pageLimit <= currentPage)) {
          onComplete();
        } else if (!done) {
          currentPage++;
          fetchNextPage(_.bind(page.nextPage, page));
        }
      });

      promise.catch(onComplete);
    }

    fetchNextPage(_.bind(this.page, this, opts));
  };

  /* jshint ignore:start */
  /**
   * @description Lists CommandInstance records from the API as a list.
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @function list
   * @memberof Twilio.Preview.Wireless.CommandList
   * @instance
   *
   * @param {object|function} opts - ...
   * @param {string} [opts.device] - The device
   * @param {string} [opts.status] - The status
   * @param {string} [opts.direction] - The direction
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no page_size is defined but a limit is defined,
   *         list() will attempt to read the limit with the most
   *         efficient page size, i.e. min(limit, 1000)
   * @param {function} [callback] - Callback to handle list of records
   *
   * @returns {Promise} Resolves to a list of records
   */
  /* jshint ignore:end */
  CommandListInstance.list = function list(opts, callback) {
    if (_.isFunction(opts)) {
      callback = opts;
      opts = {};
    }
    opts = opts || {};
    var deferred = Q.defer();
    var allResources = [];
    opts.callback = function(resource, done) {
      allResources.push(resource);

      if (!_.isUndefined(opts.limit) && allResources.length === opts.limit) {
        done();
      }
    };

    opts.done = function(error) {
      if (_.isUndefined(error)) {
        deferred.resolve(allResources);
      } else {
        deferred.reject(error);
      }
    };

    if (_.isFunction(callback)) {
      deferred.promise.nodeify(callback);
    }

    this.each(opts);
    return deferred.promise;
  };

  /* jshint ignore:start */
  /**
   * Retrieve a single page of CommandInstance records from the API.
   * Request is executed immediately
   *
   * If a function is passed as the first argument, it will be used as the callback function.
   *
   * @function page
   * @memberof Twilio.Preview.Wireless.CommandList
   * @instance
   *
   * @param {object|function} opts - ...
   * @param {string} [opts.device] - The device
   * @param {string} [opts.status] - The status
   * @param {string} [opts.direction] - The direction
   * @param {string} [opts.pageToken] - PageToken provided by the API
   * @param {number} [opts.pageNumber] -
   *          Page Number, this value is simply for client state
   * @param {number} [opts.pageSize] - Number of records to return, defaults to 50
   * @param {function} [callback] - Callback to handle list of records
   *
   * @returns {Promise} Resolves to a list of records
   */
  /* jshint ignore:end */
  CommandListInstance.page = function page(opts, callback) {
    if (_.isFunction(opts)) {
      callback = opts;
      opts = {};
    }
    opts = opts || {};

    var deferred = Q.defer();
    var data = values.of({
      'Device': opts.device,
      'Status': opts.status,
      'Direction': opts.direction,
      'PageToken': opts.pageToken,
      'Page': opts.pageNumber,
      'PageSize': opts.pageSize
    });

    var promise = this._version.page({
      uri: this._uri,
      method: 'GET',
      params: data
    });

    promise = promise.then(function(payload) {
      deferred.resolve(new CommandPage(
        this._version,
        payload,
        this._solution
      ));
    }.bind(this));

    promise.catch(function(error) {
      deferred.reject(error);
    });

    if (_.isFunction(callback)) {
      deferred.promise.nodeify(callback);
    }

    return deferred.promise;
  };

  /* jshint ignore:start */
  /**
   * create a CommandInstance
   *
   * @function create
   * @memberof Twilio.Preview.Wireless.CommandList
   * @instance
   *
   * @param {object} opts - ...
   * @param {string} opts.device - The device
   * @param {string} opts.command - The command
   * @param {string} [opts.callbackMethod] - The callback_method
   * @param {string} [opts.callbackUrl] - The callback_url
   * @param {function} [callback] - Callback to handle processed record
   *
   * @returns {Promise} Resolves to processed CommandInstance
   */
  /* jshint ignore:end */
  CommandListInstance.create = function create(opts, callback) {
    if (_.isUndefined(opts)) {
      throw new Error('Required parameter "opts" missing.');
    }
    if (_.isUndefined(opts.device)) {
      throw new Error('Required parameter "opts.device" missing.');
    }
    if (_.isUndefined(opts.command)) {
      throw new Error('Required parameter "opts.command" missing.');
    }

    var deferred = Q.defer();
    var data = values.of({
      'Device': opts.device,
      'Command': opts.command,
      'CallbackMethod': opts.callbackMethod,
      'CallbackUrl': opts.callbackUrl
    });

    var promise = this._version.create({
      uri: this._uri,
      method: 'POST',
      data: data
    });

    promise = promise.then(function(payload) {
      deferred.resolve(new CommandInstance(
        this._version,
        payload,
        this._solution.sid
      ));
    }.bind(this));

    promise.catch(function(error) {
      deferred.reject(error);
    });

    if (_.isFunction(callback)) {
      deferred.promise.nodeify(callback);
    }

    return deferred.promise;
  };

  /* jshint ignore:start */
  /**
   * Constructs a command
   *
   * @function get
   * @memberof Twilio.Preview.Wireless.CommandList
   * @instance
   *
   * @param {string} sid - The sid
   *
   * @returns {Twilio.Preview.Wireless.CommandContext}
   */
  /* jshint ignore:end */
  CommandListInstance.get = function get(sid) {
    return new CommandContext(
      this._version,
      sid
    );
  };

  return CommandListInstance;
}


/* jshint ignore:start */
/**
 * @constructor Twilio.Preview.Wireless.CommandInstance
 * @description Initialize the CommandContext
 *
 * @property {string} sid - The sid
 * @property {string} accountSid - The account_sid
 * @property {string} deviceSid - The device_sid
 * @property {string} command - The command
 * @property {string} status - The status
 * @property {string} direction - The direction
 * @property {Date} dateCreated - The date_created
 * @property {Date} dateUpdated - The date_updated
 * @property {string} url - The url
 *
 * @param {Twilio.Preview.Wireless} version - Version of the resource
 * @param {object} payload - The instance payload
 * @param {sid} sid - The sid
 */
/* jshint ignore:end */
function CommandInstance(version, payload, sid) {
  this._version = version;

  // Marshaled Properties
  this.sid = payload.sid; // jshint ignore:line
  this.accountSid = payload.account_sid; // jshint ignore:line
  this.deviceSid = payload.device_sid; // jshint ignore:line
  this.command = payload.command; // jshint ignore:line
  this.status = payload.status; // jshint ignore:line
  this.direction = payload.direction; // jshint ignore:line
  this.dateCreated = deserialize.iso8601DateTime(payload.date_created); // jshint ignore:line
  this.dateUpdated = deserialize.iso8601DateTime(payload.date_updated); // jshint ignore:line
  this.url = payload.url; // jshint ignore:line

  // Context
  this._context = undefined;
  this._solution = {
    sid: sid || this.sid,
  };
}

Object.defineProperty(CommandInstance.prototype,
  '_proxy', {
  get: function() {
    if (!this._context) {
      this._context = new CommandContext(
        this._version,
        this._solution.sid
      );
    }

    return this._context;
  },
});

/* jshint ignore:start */
/**
 * fetch a CommandInstance
 *
 * @function fetch
 * @memberof Twilio.Preview.Wireless.CommandInstance
 * @instance
 *
 * @param {function} [callback] - Callback to handle processed record
 *
 * @returns {Promise} Resolves to processed CommandInstance
 */
/* jshint ignore:end */
CommandInstance.prototype.fetch = function fetch(callback) {
  return this._proxy.fetch(callback);
};


/* jshint ignore:start */
/**
 * @constructor Twilio.Preview.Wireless.CommandContext
 * @description Initialize the CommandContext
 *
 * @param {Twilio.Preview.Wireless} version - Version of the resource
 * @param {sid} sid - The sid
 */
/* jshint ignore:end */
function CommandContext(version, sid) {
  this._version = version;

  // Path Solution
  this._solution = {
    sid: sid,
  };
  this._uri = _.template(
    '/Commands/<%= sid %>' // jshint ignore:line
  )(this._solution);
}

/* jshint ignore:start */
/**
 * fetch a CommandInstance
 *
 * @function fetch
 * @memberof Twilio.Preview.Wireless.CommandContext
 * @instance
 *
 * @param {function} [callback] - Callback to handle processed record
 *
 * @returns {Promise} Resolves to processed CommandInstance
 */
/* jshint ignore:end */
CommandContext.prototype.fetch = function fetch(callback) {
  var deferred = Q.defer();
  var promise = this._version.fetch({
    uri: this._uri,
    method: 'GET'
  });

  promise = promise.then(function(payload) {
    deferred.resolve(new CommandInstance(
      this._version,
      payload,
      this._solution.sid
    ));
  }.bind(this));

  promise.catch(function(error) {
    deferred.reject(error);
  });

  if (_.isFunction(callback)) {
    deferred.promise.nodeify(callback);
  }

  return deferred.promise;
};

module.exports = {
  CommandPage: CommandPage,
  CommandList: CommandList,
  CommandInstance: CommandInstance,
  CommandContext: CommandContext
};
