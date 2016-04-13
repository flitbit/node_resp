'use strict';

let RespValue= require('./resp-value');
let consts = require('./resp-constants');

class RespError extends RespValue{

  constructor() {
    super(consts.markers.MINUS);
  }

}

module.exports = RespError;
