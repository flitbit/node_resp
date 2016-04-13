'use strict';

let RespValue = require('./resp-value');
let consts = require('./resp-constants');

class RespSimpleString extends RespValue {

  constructor() {
    super(consts.markers.PLUS);
  }

}

module.exports = RespSimpleString;
