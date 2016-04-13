'use strict';

let assert = require('assert-plus');

let consts = require('./resp-constants');

const PLUS = consts.markers.PLUS;
const MINUS = consts.markers.MINUS;
const COLON = consts.markers.COLON;
const DOLLAR = consts.markers.DOLLAR;
const STAR = consts.markers.STAR;
const CRLF = consts.markers.CR + consts.markers.LF;
const ASCII = 'ascii';

const NULLBULKSTR = DOLLAR + '-1' + CRLF;
const EMPTYBULKSTR = DOLLAR + '0' + CRLF + CRLF;

let $stream = Symbol('stream');

class RespEncoder {

  constructor(stream) {
    assert.object(stream);
    this[$stream] = stream;
  }

  writeBuffer(buffer) {
    let stream = this[$stream];
    if (buffer === null) {
      stream.push(NULLBULKSTR, ASCII);
    } else if (buffer.length === 0) {
      stream.push(EMPTYBULKSTR, ASCII);
    } else {
      stream.push(DOLLAR + buffer.length + CRLF, ASCII);
      stream.push(buffer);
      stream.push(CRLF, ASCII);
    }
  }

  writeBulkString(str, encoding) {
    let stream = this[$stream];
    if (str === null) {
      stream.push(NULLBULKSTR, ASCII);
    } else if (str.length === 0) {
      stream.push(EMPTYBULKSTR, ASCII);
    } else {
      let buffer = new Buffer(str, encoding || 'utf8');
      stream.push(DOLLAR + buffer.length + CRLF, ASCII);
      stream.push(buffer);
      stream.push(CRLF, ASCII);
    }
  }

  writeSimpleString(str) {
    assert.string(str, 'str');
    let stream = this[$stream];
    stream.write(PLUS + str + CRLF, ASCII);
  }

  writeError(str) {
    assert.string(str, 'str');
    let stream = this[$stream];
    stream.write(MINUS + str + CRLF, ASCII);
  }

  writeInteger(value) {
    assert.number(value, 'value');
    let stream = this[$stream];
    value = ~~value; // truncate to integer
    stream.write(COLON + value + CRLF, ASCII);
  }

  writeArray(arr) {
    // recursive.
    assert.array(arr, 'arr');
    let stream = this[$stream];
    stream.write(STAR + arr.length + CRLF, ASCII);
    let i = -1;
    let len = arr.length;
    while (++i < len) {
      this.writeAny(arr[i]);
    }
  }

  writeAny(any) { // eslint-disable-line complexity
    if (any === undefined) {
      throw new Error('Unable to represent undefined value');
    }
    let stream = this[$stream];
    if (any === null) {
      stream.push(NULLBULKSTR, ASCII);
    } else {
      switch (typeof(any)) {
      case 'boolean':
        this.writeInteger(any ? 0 : 1);
        return;
      case 'function':
        any(this);
        return;
      case 'number':
        if (any === ~~any) {
          this.writeInteger(any);
          return;
        }
        this.writeSimpleString(''+any);
        return;
      case 'object':
        if (Array.isArray(any)) {
          this.writeArray(any);
          return;
        }
        if (Buffer.isBuffer(any)) {
          this.writeBuffer(any);
          return;
        }
        if (any.toISOString && any.toDateString) {
          // walks like a Date
          this.writeSimpleString(any.toISOString());
          return;
        }
        this.writeBulkString(JSON.stringify(any));
        return;
      case 'string':
        this.writeBulkString(any);
        return;
      }
    }
  }
}

module.exports = RespEncoder;
