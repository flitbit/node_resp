'use strict';

let resp = require('../lib/index');
let assert = require('assert');

let stdout = console.log.bind(console); // eslint-disable-line no-console

let tests = [{
  description: 'A null bulk string',
  encoded: '$-1\r\n',
  expect: [null]
},{
  description: 'An empty bulk string',
  encoded: '$0\r\n\r\n',
  expect: ['']
}
, {
  description: 'A sequence of simple strings and bulk strings',
  encoded: '+OK\r\n$4\r\nThis\r\n$1\r\n0\r\n$1\r\n2\r\n$1\r\n3\r\n$4\r\nfour\r\n+Success\r\n',
  expect: ['OK', 'This', '0', '2', '3', 'four', 'Success']
}, {
  description: 'An array',
  encoded: '*5\r\n:1\r\n:2\r\n:3\r\n:4\r\n$6\r\nfoobar\r\n',
  expect: [
    [1, 2, 3, 4, 'foobar']
  ]
}, {
  description: 'An empty array',
  encoded: '*0\r\n',
  expect: [
    []
  ]
}, {
  description: 'An null array',
  encoded: '*-1\r\n',
  expect: [null]
}, {
  description: 'Arrays of arrays',
  encoded: '*2\r\n*3\r\n:1\r\n:2\r\n:3\r\n*2\r\n+Foo\r\n-Bar\r\n',
  expect: [[[1,2,3], ['Foo', 'Bar']]]
}, {
  description: 'Null elements in arrays',
  encoded: '*3\r\n$3\r\nfoo\r\n$-1\r\n$3\r\nbar\r\n',
  expect: [['foo', null, 'bar']]
}
];

function compareItems(expect, actual) {
  if (Array.isArray(expect)) {
    assert.ok(Array.isArray(actual));
    assert.equal(expect.length, actual.length);
    let i = -1;
    while (++i < expect.length) {
      compareItems(expect[i], actual[i]);
    }
  } else {
    stdout(`${''+expect} = ${''+actual}`);
    assert.equal(expect, actual);
  }
}

for (let test of tests) {
  let buffer = new Buffer(test.encoded);
  let decoder = new resp.RespDecoderStream();
  let decoded = [];
  decoder.on('data', (data) => {
    assert.ok(data instanceof resp.RespValue);
    decoded.push(data.value);
  });
  decoder.on('end', () => {
    compareItems(test.expect, decoded);
  });
  decoder.write(buffer);
  decoder.end();
}
