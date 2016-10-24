'use strict';

var babel = require('rollup-plugin-babel');
var babelrc = require('babelrc-rollup');

var rollup = require('rollup');
var fs = require("fs");
var path = require("path");

let pkg = {
    "dependencies": {}
};
let external = Object.keys(pkg.dependencies);

var settings = {
    entry: 'index.js',
    plugins: [
        babel(babelrc.default())
    ],
    external: external
};

rollup.rollup(settings).then(function (bundle) {
    bundle.write({
        format: 'es',
        dest: 'dist/animated-points.es.js',
        sourceMap: true
    });
    bundle.write({
        format: 'cjs',
        dest: 'dist/animated-points.js',
        sourceMap: true
    });
});