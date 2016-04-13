'use strict';

let assert = require('assert-plus');
let RespValue= require('./resp-value');
let consts = require('./resp-constants');

class RespInteger extends RespValue{

  constructor() {
    super(consts.markers.COLON);
  }

  get response() {
    assert.ok(this.isComplete, 'incomplete');
    return parseInt(this.raw, 10);
  }


}

module.exports = RespInteger;
