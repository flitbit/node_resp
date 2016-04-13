'use strict';

let assert = require('assert-plus');
let RespValue = require('./resp-value');

class RespLengthIndicator extends RespValue {

  constructor(marker) {
    assert.number(marker, 'marker');
    super(marker);
  }

  get value() {
    assert.ok(this.isComplete, 'incomplete');
    return parseInt(this.raw, 10);
  }

}

module.exports = RespLengthIndicator;
