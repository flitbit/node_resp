'use strict';

let RespValue = require('./resp-value');
let consts = require('./resp-constants');
let RespLengthIndicator = require('./resp-length-indicator');
let RespSimpleString = require('./resp-simple-string');
let RespBulkString = require('./resp-bulk-string');
let RespError = require('./resp-error');
let RespInteger = require('./resp-integer');

const PLUS = consts.markers.PLUS;
const MINUS = consts.markers.MINUS;
const COLON = consts.markers.COLON;
const DOLLAR = consts.markers.DOLLAR;
const STAR = consts.markers.STAR;

let $length = Symbol('length');
let $partial = Symbol('partial');

class RespArray extends RespValue {

  constructor() {
    super(consts.markers.STAR);
    this[$length] = new RespLengthIndicator(consts.markers.STAR);
  }

  get isComplete() {
    return this.raw === null || this.raw.length === this[$length].value;
  }

  continuation(buffer, cursor) { // eslint-disable-line complexity
    // special case when previous chunk gave us \r but not \n
    if (this.terminators === 1) {
      return this.expectLf(buffer, cursor);
    }

    let c = cursor;
    let local = this.raw;
    let length = this[$length].value;
    if (local === undefined) {
      if (length === -1) {
        // null array (historical)
        this.raw = null;
        return 0;
      }
      this.raw = local = [];
    }
    if (length) {

      let partial = this[$partial];
      if (partial) {
        c += partial.read(buffer, c);
        if (partial.isComplete) {
          local.push(partial);
          this[$partial] = partial = undefined;
        }
      }

      while (c < buffer.length) {
        switch (buffer[c]) {
        case DOLLAR: // '$' a binary safe string (up to 512 MB)
          partial = new RespBulkString();
          c += partial.read(buffer, c);
          break;
        case STAR: // '*' an array
          partial = new RespArray();
          c += partial.read(buffer, c);
          break;
        case PLUS: // '+' a simple string
          partial = new RespSimpleString();
          c += partial.read(buffer, c);
          break;
        case MINUS: // '-' an error
          partial = new RespError();
          c += partial.read(buffer, c);
          break;
        case COLON: // ':' an integer
          partial = new RespInteger();
          c += partial.read(buffer, c);
          break;
        }
        if (partial.isComplete) {
          local.push(partial.value);
          this[$partial] = partial = undefined;
          if (local.length === length) {
            return (c - cursor);
          }
        }
      }
      if (partial) {
        this[$partial] = partial;
      }
    }

    return (c - cursor);
  }

  read(buffer, cursor) {
    let c = cursor;
    let encodedLength = this[$length];
    if (!encodedLength.isComplete) {
      c += encodedLength.read(buffer, c);
    }
    if (encodedLength.isComplete) {
      c += this.continuation(buffer, c);
    }
    return (c - cursor);
  }

}

module.exports = RespArray;
