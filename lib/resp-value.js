'use strict';

let assert = require('assert-plus');

let consts = require('./resp-constants');

const PLUS = consts.markers.PLUS;
const CR = consts.markers.CR;
const LF = consts.markers.LF;

let $marker = Symbol('marker');
let $markerObserved = Symbol('markerObserved');
let $terminators = Symbol('terminators');
let $data = Symbol('data');

function seek(buffer, cr, offset, end) {
  end = end || buffer.length;
  if (offset < 0 || offset > end) {
    return -1;
  }
  let c = offset - 1;
  while (++c < end) {
    if (buffer[c] === cr) {
      return c;
    }
  }
  return -1;
}

class RespValue {
  constructor(marker) {
    this[$marker] = marker || PLUS;
    this[$terminators] = 0;
  }

  get terminators() {
    return this[$terminators];
  }

  get isComplete() {
    return this.terminators === 2;
  }

  get value() {
    assert.ok(this.isComplete, 'incomplete');
    return this[$data];
  }

  get raw() {
    return this[$data];
  }
  set raw(data) {
    this[$data] = data;
  }

  debugView() {
    return `<${this.constructor.name}>${this.isComplete? ' ': ' (partial) '} ${String.fromCharCode(this[$marker])} ${this[$data]}`;
  }

  markTerminator() {
    return ++this[$terminators];
  }

  expectCr(buffer, cursor) {
    assert.ok(cursor >= 0 && cursor < buffer.length, 'cursor out of range');
    if (buffer[cursor] !== CR) {
      throw new Error(
        `RESP encoding ${this.debugView()}: expected [\\r], observed [${String.fromCharCode(buffer[cursor])}].`
      );
    }
    this.markTerminator();
    return 1;
  }

  expectLf(buffer, cursor) {
    assert.ok(cursor >= 0 && cursor < buffer.length, 'cursor out of range');
    if (buffer[cursor] !== LF) {
      throw new Error(
        `RESP encoding ${this.debugView()}: expected [\\n], observed [${String.fromCharCode(buffer[cursor])}].`
      );
    }
    this.markTerminator();
    return 1;
  }

  continuation(buffer, cursor) {
    // special case when previous chunk gave us \r but not \n
    if (this.terminators === 1) {
      return this.expectLf(buffer, cursor);
    }
    let term = 0;
    let end = seek(buffer, CR, cursor);
    if (end > cursor) {
      term = this.markTerminator();
    } else {
      end = buffer.length;
    }
    this[$data] = buffer.toString('ascii', cursor, end);
    if ((end + 1) < buffer.length && buffer[end + 1] === LF) {
      term = this.markTerminator();
    }
    return (end - cursor) + term;
  }

  read(buffer, cursor) {
    if (this[$markerObserved]) {
      return this.continuation(buffer, cursor);
    }
    let c = cursor;
    let marker = buffer[c++];
    if (marker !== this[$marker]) {
      throw new Error(
        `RESP encoding out of sync: expected ${String.fromCharCode(this.marker)}, observed ${String.fromCharCode(marker)}.`
      );
    }
    this[$markerObserved] = marker;
    let term = 0;
    let end = seek(buffer, CR, c);
    if (end > c) {
      term = this.markTerminator();
    } else {
      end = buffer.length;
    }
    this[$data] = buffer.toString('ascii', c, end);
    if ((end + 1) < buffer.length && buffer[end + 1] === LF) {
      term = this.markTerminator();
    }
    return (end - cursor) + term;
  }

}

module.exports = RespValue;
