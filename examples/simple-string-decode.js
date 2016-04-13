'use strict';

let SimpleString= require('../lib').RespSimpleString;
var assert = require('assert');

var buffer = new Buffer('+OK\r\n');

//
// Decode full RESP simple string from one buffer...
//
var simple = new SimpleString();

assert.equal(simple.read(buffer, 0), 5);
assert.equal(simple.value, 'OK');

//
// Decode RESP simple string from a buffer with more data in it...
//
let overfull = new Buffer('+Overfull\r\n+Ok\r\n');

let d = new SimpleString();

let cursor = d.read(overfull, 0);

assert.equal(cursor, 11);
assert.equal(d.value, 'Overfull');
// the rest
let d1 = new SimpleString();

cursor += d1.read(overfull, cursor);

assert.equal(cursor, overfull.length);
assert.equal(d1.value, 'Ok');

//
// Decode RESP simple string from some jagged buffers
//
let jagged = new Buffer('+Ok\r');
let more = new Buffer('\n+');
let rest = new Buffer('Ok\r\n');

let d3 = new SimpleString();
cursor = 0;
cursor += d3.read(jagged, cursor);

assert.equal(cursor, jagged.length);
assert.equal(d3.isComplete, false);

cursor = 0;
cursor += d3.read(more, cursor);

assert.equal(cursor, 1);
assert.equal(d3.value, 'Ok');
assert.equal(d3.isComplete, true);

let d4 = new SimpleString();
cursor += d4.read(more, cursor);

assert.equal(cursor, more.length);
assert.equal(d4.isComplete, false);

cursor = 0;
cursor += d4.read(rest, cursor);

assert.equal(cursor, rest.length);
assert.equal(d4.value, 'Ok');
assert.equal(d4.isComplete, true);

