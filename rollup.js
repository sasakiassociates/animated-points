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

//Copied from https://github.com/mrdoob/three.js/blob/dev/rollup.config.js
function glsl () {
    return {
        transform ( code, id ) {
            if ( !/\.glsl$/.test( id ) ) return;

            var transformedCode = 'export default ' + JSON.stringify(
                    code
                        .replace( /[ \t]*\/\/.*\n/g, '' )
                        .replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' )
                        .replace( /\n{2,}/g, '\n' )
                ) + ';';
            return {
                code: transformedCode,
                map: { mappings: '' }
            }
        }
    };
}

var settings = {
    entry: 'index.js',
    plugins: [
        glsl(),
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
        dest: 'dist/animated-points.cjs.js',
        sourceMap: true
    });
    bundle.write({
        format: 'iife',
        moduleName: 'AnimatedPoints',
        dest: 'dist/animated-points.js',
        sourceMap: true
    });
}).catch(function (err) {
    console.log('ERR ' + err);
});