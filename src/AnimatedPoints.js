'use strict';
import {ShaderIndex} from './glsl/ShaderIndex';

export default class AnimatedPoints {

    constructor(numberOfPoints, sizeAttenuation = false) {
        this.animationTime = 0;
        this.animationPos = 0;

        this.easingFunction = (v) => {
            return v
        };

        this.numberOfPoints = numberOfPoints;
        this.sizeAttenuation = sizeAttenuation;
        this.fromProperties = {
            r: new Float32Array(this.numberOfPoints),
            g: new Float32Array(this.numberOfPoints),
            b: new Float32Array(this.numberOfPoints),
            a: new Float32Array(this.numberOfPoints),
            size: new Float32Array(this.numberOfPoints),
        };
        this.toProperties = {
            r: new Float32Array(this.numberOfPoints),
            g: new Float32Array(this.numberOfPoints),
            b: new Float32Array(this.numberOfPoints),
            a: new Float32Array(this.numberOfPoints),
            size: new Float32Array(this.numberOfPoints),
        };

        this.fromPositions = new Float32Array(this.numberOfPoints * 3);
        this.toPositions = new Float32Array(this.numberOfPoints * 3);

        this.geometry = new THREE.BufferGeometry();
        this.material = this.getMaterial();

        for (let i = 0; i < this.numberOfPoints; i++) {
            Object.keys(this.fromProperties).forEach((k) => {
                this.fromProperties[k][i] = 0.1;
                this.toProperties[k][i] = 0.1;
            });
        }


        this.particles = new THREE.Points(this.geometry, this.material);
    }

    getMaterial() {
        //"position" is used internally by ThreeJS so the name cannot change
        this.geometry.addAttribute('position', new THREE.BufferAttribute(this.fromPositions, 3));
        this.geometry.addAttribute('position_to', new THREE.BufferAttribute(this.toPositions, 3));

        Object.keys(this.fromProperties).forEach((k) => {
            this.geometry.addAttribute(k + '_from', new THREE.BufferAttribute(this.fromProperties[k], 1));
            this.geometry.addAttribute(k + '_to', new THREE.BufferAttribute(this.toProperties[k], 1));
        });

        return new THREE.ShaderMaterial({
            uniforms: {
                animationPos: {value: this.animationPos},
                scale: {type: 'f', value: (this.sizeAttenuation) ? window.innerHeight / 2 : 0},
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
    setProperties(properties, easingFn) {
        var propKeys = Object.keys(this.fromProperties);

        if (easingFn) {
            this.easingFunction = easingFn;
        }

        var keysWithChanges = {};

        var keyMatch = {
            'position': ['position', 'position_to'],//special case since 'position' is hard-coded in ThreeJSs
        };

        propKeys.forEach((k) => {
            keyMatch[k] = [`${k}_from`, `${k}_to`]
        });

        //when setProperties is called, we switch the from position to be the current position of the nodes (even if in the middle of an animation)
        //these values are calculated internally in the shader, but we don't have access to them there
        properties.forEach((obj, i) => {
            propKeys.forEach((k) => {
                this.fromProperties[k][i] = this.fromProperties[k][i] * (1 - this.animationPos) + this.toProperties[k][i] * this.animationPos;
            });
            this.fromPositions[i * 3] = this.fromPositions[i * 3] * (1 - this.animationPos) + this.toPositions[i * 3] * this.animationPos;
            this.fromPositions[i * 3 + 1] = this.fromPositions[i * 3 + 1] * (1 - this.animationPos) + this.toPositions[i * 3 + 1] * this.animationPos;
            this.fromPositions[i * 3 + 2] = this.fromPositions[i * 3 + 2] * (1 - this.animationPos) + this.toPositions[i * 3 + 2] * this.animationPos;
        });

        properties.forEach((obj, i) => {
            if (obj.color) {
                AnimatedPoints._injectRGB(obj, obj.color)
            }
            propKeys.forEach((k) => {
                if (obj[k] !== null) {
                    if (this.toProperties[k][i] !== obj[k]) {
                        this.toProperties[k][i] = obj[k];
                        keysWithChanges[k] = true;
                    }
                }
            });
            AnimatedPoints._clamp(obj, ['r', 'g', 'b', 'a'], 0, 1);
            if (obj.x !== undefined) {
                if (this.toPositions[i * 3] !== obj.x) {
                    this.toPositions[i * 3] = obj.x;
                    keysWithChanges['position'] = true;
                }
            }
            if (obj.y !== undefined) {
                if (this.toPositions[i * 3 + 1] !== obj.y) {
                    this.toPositions[i * 3 + 1] = obj.y;
                    keysWithChanges['position'] = true;
                }
            }
            if (obj.z !== undefined) {
                if (this.toPositions[i * 3 + 2] !== obj.z) {
                    this.toPositions[i * 3 + 2] = obj.z;
                    keysWithChanges['position'] = true;
                }
            }
        });

        Object.keys(keysWithChanges).forEach((key) => {
            keyMatch[key].forEach((attr, i) => {
                this.geometry.attributes[attr].needsUpdate = true;
            });
        });

        this.startAnimation();
    }

    startAnimation() {
        //TODO if we set the same targets twice it won't call needsUpdate, but it will reset the animation
        this.setAnimationTime(0);
        this.animationComplete = false;
    }

    attributeKeys(propKeys) {
        const keyMatch = {
            'position': ['position', 'position_to'],//special case since 'position' is hard-coded in ThreeJSs
        };

        for (let k of propKeys) {
            keyMatch[k] = [k + '_from', k + '_to']
        }
        return keyMatch;
    }

    setEndToStart() {
        const propKeys = Object.keys(this.fromProperties);
        const keyMatch = this.attributeKeys(propKeys);
        const n = this.numberOfPoints;
        // console.time('setEndToStart');
        for (let i = 0; i < n; i++) {
            for (let k of propKeys) {
                this.fromProperties[k][i] = this.toProperties[k][i];
            }
            this.fromPositions[i * 3] = this.toPositions[i * 3];
            this.fromPositions[i * 3 + 1] = this.toPositions[i * 3 + 1];
            this.fromPositions[i * 3 + 2] = this.toPositions[i * 3 + 2];
        }

        //once they are all reset, we need to push these changes through
        for (let key of Object.keys(keyMatch)) {
            for (let attr of keyMatch[key]) {
                // console.log(`Needs update ${attr}`);
                this.geometry.attributes[attr].needsUpdate = true;
            }
        }
        // this.geometry.verticesNeedUpdate = true;
        this.geometry.computeBoundingSphere();//if we don't recompute, then the point cloud object may be hidden if the current boundingSphere is not in view
        // console.timeEnd('setEndToStart');
    }

    setAnimationTime(val) {
        this.animationTime = Math.max(0, Math.min(1, val));
        this.animationPos = this.easingFunction(this.animationTime);

        this.material.uniforms.animationPos.value = this.animationPos;

        if (!this.animationComplete && this.animationTime === 1) {
            this.animationComplete = true;
            this.setEndToStart();
        }
    }

    step(amt) {
        this.setAnimationTime(this.animationTime + amt);
    }

    getObject() {
        return this.particles;
    }

    static _hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static _clamp(obj, props, min, max) {
        for (let prop of props) {
            obj[prop] = Math.min(Math.max(obj[prop], min), max);
        }
    }

    static _injectRGB(obj, color) {
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
}