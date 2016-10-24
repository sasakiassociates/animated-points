var numberOfPoints = 1000000;
var records = [];

for (var i = 0; i < numberOfPoints; i++) {
    var sin = Math.sin(i);
    var cos = Math.cos(i);
    var tan = Math.tan(i);
    records.push({index: i, sin: sin, cos: cos, tan: tan});
}

var _getPositions1 = function (inputs) {
    var properties = [];
    var width = window.innerWidth * 5;//spread it beyond the limits a little
    var xSize = width / 10000;
    inputs.forEach(function (input, i) {
        properties.push({
            x: xSize * (input.index % 10000) - width / 2,
            y: input.cos * 400,
            size: 2,
            r: Math.abs(input.sin),
            g: Math.abs(input.cos),
            b: Math.abs(input.tan),
        });
    });
    return properties;
};

var _getPositions2 = function (inputs) {
    var properties = [];
    inputs.forEach(function (input, i) {
        properties.push({
            x: input.sin * 400 + Math.random() * 20,
            y: input.cos * 400 + Math.random() * 20,
            size: 1,
            r: Math.abs(input.tan),
            g: Math.abs(input.sin),
            b: Math.abs(input.cos),
        });
    });

    return properties;
};

var application = function (app) {
    app.onTick = function () {
    };
    app.setup = function () {
        app.scene = new THREE.Scene();
        // app.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.3, 2000);

        var aspect = window.innerWidth / window.innerHeight;
        var d = 500;

        //TODO how do we map between three.js and screen coordinates

        //left, right, top, bottom, near, far
        app.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 5000);
        app.camera.position.set(0, 0, 100); // all components equal
        app.camera.lookAt(app.scene.position); // or the origin
        // app.camera.position.z = 1000;

        app.renderer = new THREE.WebGLRenderer();
        app.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(app.renderer.domElement);

        // var cube;
        // cube = new THREE.Mesh(new THREE.CubeGeometry(100, 100, 100), new THREE.MeshNormalMaterial());
        // app.scene.add(cube);

        app.render();
    };

    app.render = function () {
        requestAnimationFrame(function () {
            app.render();
            app.onTick();
        });

        app.renderer.render(app.scene, app.camera);
    };

    app.setup();
};

var app = {};
new application(app);

//create a new instance of AnimatedPoints passing in the total number of records (this must be declared up front and cannot be changed)
var animatedPoints = new AnimatedPoints.AnimatedPoints(records.length);
animatedPoints.setProperties(_getPositions1(records));

//to animate to the next state, calculate a different set of positions for the data. Using a 2 seond delay as an example.
var counter = 0;
setInterval(function () {
    counter++;
    animatedPoints.setProperties((counter % 2 === 0) ? _getPositions1(records) : _getPositions2(records));
}, 4000);

app.onTick = function () {
    animatedPoints.step(0.01);
};
app.scene.add(animatedPoints.getObject());
