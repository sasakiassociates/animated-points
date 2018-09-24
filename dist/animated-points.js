(function (exports) {
'use strict';

var animated_points_vertex = "attribute float size_from;\r\nattribute float size_to;\r\n\r\nattribute float r_from;\r\nattribute float g_from;\r\nattribute float b_from;\r\nattribute float a_from;\r\n\r\nattribute float r_to;\r\nattribute float g_to;\r\nattribute float b_to;\r\nattribute float a_to;\r\n\r\nattribute vec3 position_to;\r\n\r\nvarying vec4 vColor;\r\nuniform float animationPos;\r\nuniform float scale;\r\n\r\nvoid main() {\r\n    vColor = vec4(\r\n        r_from * (1.0 - animationPos) + r_to * animationPos,\r\n        g_from * (1.0 - animationPos) + g_to * animationPos,\r\n        b_from * (1.0 - animationPos) + b_to * animationPos,\r\n        a_from * (1.0 - animationPos) + a_to * animationPos\r\n    );\r\n    vec4 mvPosition = modelViewMatrix * vec4(position * (1.0 - animationPos) + position_to * animationPos, 1.0);\r\n    gl_Position = projectionMatrix * mvPosition;\r\n    float pointSize = size_from * (1.0 - animationPos) + size_to * animationPos;\r\n    if (scale > 0.0) {\r\n        gl_PointSize = pointSize * (scale / length( mvPosition.xyz ));\r\n    } else {\r\n        gl_PointSize = pointSize;\r\n    }\r\n}";

var animated_points_fragment = "varying vec4 vColor;\r\n\r\nvoid main() {\r\n    gl_FragColor = vColor;\r\n}";

var ShaderIndex = {
    animated_points_vertex: animated_points_vertex,
    animated_points_fragment: animated_points_fragment
};

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var AnimatedPoints = function () {
    function AnimatedPoints(numberOfPoints) {
        var _this = this;

        var sizeAttenuation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        classCallCheck(this, AnimatedPoints);

        this.animationTime = 0;
        this.animationPos = 0;

        this.easingFunction = function (v) {
            return v;
        };

        this.numberOfPoints = numberOfPoints;
        this.sizeAttenuation = sizeAttenuation;
        this.fromProperties = {
            r: new Float32Array(this.numberOfPoints),
            g: new Float32Array(this.numberOfPoints),
            b: new Float32Array(this.numberOfPoints),
            a: new Float32Array(this.numberOfPoints),
            size: new Float32Array(this.numberOfPoints)
        };
        this.toProperties = {
            r: new Float32Array(this.numberOfPoints),
            g: new Float32Array(this.numberOfPoints),
            b: new Float32Array(this.numberOfPoints),
            a: new Float32Array(this.numberOfPoints),
            size: new Float32Array(this.numberOfPoints)
        };

        this.fromPositions = new Float32Array(this.numberOfPoints * 3);
        this.toPositions = new Float32Array(this.numberOfPoints * 3);

        this.geometry = new THREE.BufferGeometry();
        this.material = this.getMaterial();

        var _loop = function _loop(i) {
            Object.keys(_this.fromProperties).forEach(function (k) {
                _this.fromProperties[k][i] = 0.1;
                _this.toProperties[k][i] = 0.1;
            });
        };

        for (var i = 0; i < this.numberOfPoints; i++) {
            _loop(i);
        }

        this.particles = new THREE.Points(this.geometry, this.material);
    }

    createClass(AnimatedPoints, [{
        key: 'getMaterial',
        value: function getMaterial() {
            var _this2 = this;

            //"position" is used internally by ThreeJS so the name cannot change
            this.geometry.addAttribute('position', new THREE.BufferAttribute(this.fromPositions, 3));
            this.geometry.addAttribute('position_to', new THREE.BufferAttribute(this.toPositions, 3));

            Object.keys(this.fromProperties).forEach(function (k) {
                _this2.geometry.addAttribute(k + '_from', new THREE.BufferAttribute(_this2.fromProperties[k], 1));
                _this2.geometry.addAttribute(k + '_to', new THREE.BufferAttribute(_this2.toProperties[k], 1));
            });

            return new THREE.ShaderMaterial({
                uniforms: {
                    animationPos: { value: this.animationPos },
                    scale: { type: 'f', value: this.sizeAttenuation ? window.innerHeight / 2 : 0 }
                },
                transparent: true,
                vertexShader: ShaderIndex.animated_points_vertex,
                fragmentShader: ShaderIndex.animated_points_fragment

            });
        }

        /**
         * set the properties to which to animate using an optional easing function
         * @param {Object[]} properties - an array of objects
         *      @param {Number} [properties[].x] - x position
         *      @param {Number} [properties[].y] - y position
         *      @param {Number} [properties[].z] - z position
         *      @param {Number} [properties[].size] - size in pixels
         *      @param {string} [properties[].color] - color in hex format (#ff0000)
         * @param {Function} [easingFn] - an easing function such as those found in the 'eases' package https://www.npmjs.com/package/eases
         */

    }, {
        key: 'setProperties',
        value: function setProperties(properties, easingFn) {
            var _this3 = this;

            var propKeys = Object.keys(this.fromProperties);

            if (easingFn) {
                this.easingFunction = easingFn;
            }

            var keysWithChanges = {};

            var keyMatch = {
                'position': ['position', 'position_to'] };

            propKeys.forEach(function (k) {
                keyMatch[k] = [k + '_from', k + '_to'];
            });

            //when setProperties is called, we switch the from position to be the current position of the nodes (even if in the middle of an animation)
            //these values are calculated internally in the shader, but we don't have access to them there
            properties.forEach(function (obj, i) {
                propKeys.forEach(function (k) {
                    _this3.fromProperties[k][i] = _this3.fromProperties[k][i] * (1 - _this3.animationPos) + _this3.toProperties[k][i] * _this3.animationPos;
                });
                _this3.fromPositions[i * 3] = _this3.fromPositions[i * 3] * (1 - _this3.animationPos) + _this3.toPositions[i * 3] * _this3.animationPos;
                _this3.fromPositions[i * 3 + 1] = _this3.fromPositions[i * 3 + 1] * (1 - _this3.animationPos) + _this3.toPositions[i * 3 + 1] * _this3.animationPos;
                _this3.fromPositions[i * 3 + 2] = _this3.fromPositions[i * 3 + 2] * (1 - _this3.animationPos) + _this3.toPositions[i * 3 + 2] * _this3.animationPos;
            });

            properties.forEach(function (obj, i) {
                if (obj.color) {
                    AnimatedPoints._injectRGB(obj, obj.color);
                }
                propKeys.forEach(function (k) {
                    if (obj[k] !== null) {
                        if (_this3.toProperties[k][i] !== obj[k]) {
                            _this3.toProperties[k][i] = obj[k];
                            keysWithChanges[k] = true;
                        }
                    }
                });
                AnimatedPoints._clamp(obj, ['r', 'g', 'b', 'a'], 0, 1);
                if (obj.x !== undefined) {
                    if (_this3.toPositions[i * 3] !== obj.x) {
                        _this3.toPositions[i * 3] = obj.x;
                        keysWithChanges['position'] = true;
                    }
                }
                if (obj.y !== undefined) {
                    if (_this3.toPositions[i * 3 + 1] !== obj.y) {
                        _this3.toPositions[i * 3 + 1] = obj.y;
                        keysWithChanges['position'] = true;
                    }
                }
                if (obj.z !== undefined) {
                    if (_this3.toPositions[i * 3 + 2] !== obj.z) {
                        _this3.toPositions[i * 3 + 2] = obj.z;
                        keysWithChanges['position'] = true;
                    }
                }
            });

            Object.keys(keysWithChanges).forEach(function (key) {
                keyMatch[key].forEach(function (attr, i) {
                    _this3.geometry.attributes[attr].needsUpdate = true;
                });
            });

            this.startAnimation();
        }
    }, {
        key: 'startAnimation',
        value: function startAnimation() {
            //TODO if we set the same targets twice it won't call needsUpdate, but it will reset the animation
            this.setAnimationTime(0);
            this.animationComplete = false;
        }
    }, {
        key: 'attributeKeys',
        value: function attributeKeys(propKeys) {
            var keyMatch = {
                'position': ['position', 'position_to'] };

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = propKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var k = _step.value;

                    keyMatch[k] = [k + '_from', k + '_to'];
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return keyMatch;
        }
    }, {
        key: 'setEndToStart',
        value: function setEndToStart() {
            var propKeys = Object.keys(this.fromProperties);
            var keyMatch = this.attributeKeys(propKeys);
            var n = this.numberOfPoints;
            // console.time('setEndToStart');
            for (var i = 0; i < n; i++) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = propKeys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var k = _step2.value;

                        this.fromProperties[k][i] = this.toProperties[k][i];
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                this.fromPositions[i * 3] = this.toPositions[i * 3];
                this.fromPositions[i * 3 + 1] = this.toPositions[i * 3 + 1];
                this.fromPositions[i * 3 + 2] = this.toPositions[i * 3 + 2];
            }

            //once they are all reset, we need to push these changes through
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = Object.keys(keyMatch)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var key = _step3.value;
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = keyMatch[key][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var attr = _step4.value;

                            // console.log(`Needs update ${attr}`);
                            this.geometry.attributes[attr].needsUpdate = true;
                        }
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
                        }
                    }
                }
                // this.geometry.verticesNeedUpdate = true;
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            this.geometry.computeBoundingSphere(); //if we don't recompute, then the point cloud object may be hidden if the current boundingSphere is not in view
            // console.timeEnd('setEndToStart');
        }
    }, {
        key: 'setAnimationTime',
        value: function setAnimationTime(val) {
            this.animationTime = Math.max(0, Math.min(1, val));
            this.animationPos = this.easingFunction(this.animationTime);

            this.material.uniforms.animationPos.value = this.animationPos;

            if (!this.animationComplete && this.animationTime === 1) {
                this.animationComplete = true;
                this.setEndToStart();
            }
        }
    }, {
        key: 'step',
        value: function step(amt) {
            this.setAnimationTime(this.animationTime + amt);
        }
    }, {
        key: 'getObject',
        value: function getObject() {
            return this.particles;
        }
    }], [{
        key: '_hexToRgb',
        value: function _hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
    }, {
        key: '_clamp',
        value: function _clamp(obj, props, min, max) {
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = props[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var prop = _step5.value;

                    obj[prop] = Math.min(Math.max(obj[prop], min), max);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        }
    }, {
        key: '_injectRGB',
        value: function _injectRGB(obj, color) {
            var rgb = AnimatedPoints._hexToRgb(color);
            if (!rgb) {
                obj.r = 0;
                obj.g = 0;
                obj.b = 0;
                obj.a = 0;
                return;
            }
            obj.r = rgb.r / 255;
            obj.g = rgb.g / 255;
            obj.b = rgb.b / 255;

            if (!obj.a) {
                obj.a = 1;
            }
        }
    }]);
    return AnimatedPoints;
}();

exports.AnimatedPoints = AnimatedPoints;

}((this.AnimatedPoints = this.AnimatedPoints || {})));
//# sourceMappingURL=animated-points.js.map
