/*
 * transport.js: Base Transport object for all Winston transports.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var events = require('events'),
    util = require('util'); 

//
// ### function Transport (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Tranport object responsible
// base functionality for all winston transports.
//
var Transport = exports.Transport = function (options) {
  events.EventEmitter.call(this);
  
  options               = options        || {};  
  this.level            = options.level  || 'info';
  this.silent           = options.silent || false;
  this.handleExceptions = options.handleExceptions || false;
};

//
// Inherit from `events.EventEmitter`.
//
util.inherits(Transport, events.EventEmitter);
//
// ### function logException (msg, meta, callback) 
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Logs the specified `msg`, `meta` and responds to the callback once the log
// operation is complete to ensure that the event loop will not exit before
// all logging has completed.
//
Transport.prototype.logException = function (msg, meta, callback) {
  var self = this;

  if (meta && this.prettyPrint) {
    if (meta.stack) // we only delete one of them, if there is both of them
      delete meta.trace // we don't need to have both of them, meta.stack is more readable
    if (meta.process && meta.process.memoryUsage) {
      var mem = meta.process.memoryUsage;
      for (var key in mem) {
        mem[key] = addUnit(mem[key], 'KMGTPEZY', 1024) + 'B'; // Make memoryUsage numbers more readable, add units to it
      }
    }
    if (meta.os && meta.os.uptime) {
      meta.os.uptime = addUnit(meta.os.uptime, ['minute', 'hour', 'day'],  [60, 60, 24], true); 
    }
  }
 
  function onLogged () {
    self.removeListener('error', onError);
    callback();
  }
  
  function onError () {
    self.removeListener('logged', onLogged);
    callback();
  }
  
  this.once('logged', onLogged);
  this.once('error', onError);  
  this.log('error', msg, meta, function () { });
};

/*
 * Adds prefixes/units to a number with a base unit
 * @params prefixes {Array|String}
 * @params prefixVal {Array|Number} The value for each prefix, or a number for all of them
 * @params addS {Boolean} To add a trailing S, if the number is not one
 * @returns {String} String with a unit
 */

function addUnit(num, prefixes, prefixVal, addS) {
  var i = -1;
  
  if (typeof prefixVal === 'number') {
    var prefixValOld = prefixVal;
    len = prefixes.length;
    prefixVal = new Array(len + 1);
    for (var i2 = 0; i2 < len; i2++) {
      prefixVal[i2] = prefixValOld;
    }
    prefixVal[i2] = prefixValOld; // Add it one more time to make sure we won't get refrence error, in the while block
  }
 
  while (num > prefixVal[i + 1] && prefixes[i + 1]) {
    i++;
    num = Math.round(num / prefixVal[i]);
    
  }
  
  num = (i === -1) ? num : num + ' ' + prefixes[i];

  if (addS && num != 1) {
    num += 's';
  }

  return num;
}

