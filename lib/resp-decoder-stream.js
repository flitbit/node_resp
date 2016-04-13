'use strict';

let Transform = require('stream').Transform;

let consts = require('./resp-constants');
let RespSimpleString = require('./resp-simple-string');
let RespArray = require('./resp-array');
let RespBulkString = require('./resp-bulk-string');
let RespError = require('./resp-error');
let RespInteger= require('./resp-integer');

const PLUS = consts.markers.PLUS;
const MINUS = consts.markers.MINUS;
const COLON = consts.markers.COLON;
const DOLLAR = consts.markers.DOLLAR;
const STAR = consts.markers.STAR;

let $partial = Symbol('partial');

class RespDecoderStream extends Transform {

  constructor() {
    super({ readableObjectMode: true });
  }

  get partial() {
    return this[$partial];
  }

  _transform(chunk, encoding, callback) { // eslint-disable-line complexity
    let cursor = 0;
    let partial = this.partial;
    if (partial) {
      cursor += partial.read(chunk, cursor);
      if (partial.isComplete) {
        this.push(partial);
        this[$partial] = partial = undefined;
      }
    }

    while (cursor < chunk.length) {
      switch (chunk[cursor]) {
      case DOLLAR: // '$' a binary safe string (up to 512 MB)
        partial = new RespBulkString();
        cursor += partial.read(chunk, cursor);
        break;
      case STAR: // '*' an array
        partial = new RespArray();
        cursor += partial.read(chunk, cursor);
        break;
      case PLUS: // '+' a simple string
        partial = new RespSimpleString();
        cursor += partial.read(chunk, cursor);
        break;
      case MINUS: // '-' an error
        partial = new RespError();
        cursor += partial.read(chunk, cursor);
        break;
      case COLON: // ':' an integer
        partial = new RespInteger();
        cursor += partial.read(chunk, cursor);
        break;
      }
      if (partial.isComplete) {
        this.push(partial);
        this[$partial] = partial = undefined;
      }
    }
    if (partial && !partial.isComplete) {
      this[$partial] = partial;
    }
    callback();
  }

  _flush(callback) {
    this[$partial] = undefined;
    callback();
  }

}


module.exports = RespDecoderStream;
