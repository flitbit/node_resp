'use strict';

let RespValue = require('./resp-value');
let consts = require('./resp-constants');
let RespLengthIndicator = require('./resp-length-indicator');

let $length = Symbol('length');
let $index = Symbol('index');

class RespBulkString extends RespValue {

  constructor() {
    super(consts.markers.DOLLAR);
    this[$length] = new RespLengthIndicator(consts.markers.DOLLAR);
    this[$index] = 0;
  }

  get isComplete() {
    return this.raw === null || super.isComplete;
  }

  continuation(buffer, cursor) {
    // special case when previous chunk gave us \r but not \n
    if (this.terminators === 1) {
      return this.expectLf(buffer, cursor);
    }

    let c = cursor;
    let local = this.raw;
    if (local === undefined) {
      let length = this[$length].value;
      if (length === -1) {
        // null bulk string
        this.raw = null;
        return 0;
      }
      // TODO: sanity check the response length, possibly impose optional limit
      this.raw = local = new Buffer(this[$length].value);
    }
    let length = local.length;
    if (length) {
      let localIndex = this[$index];
      let remaining = length - localIndex;

      let readLen = Math.min(remaining, buffer.length - c);

      buffer.copy(local, localIndex, c, c + readLen);
      c += readLen;
      this[$index] += readLen;
    }

    if (c < buffer.length) {
      c += this.expectCr(buffer, c);
      if (c < buffer.length) {
        c += this.expectLf(buffer, c);
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

module.exports = RespBulkString;
