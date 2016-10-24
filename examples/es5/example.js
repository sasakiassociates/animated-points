var numberOfPoints = 200000;
var records = [];

for (var i = 0; i < numberOfPoints; i++) {
    var sin = Math.sin(i);
    var cos = Math.cos(i);
    var tan = Math.tan(i);
    records.push({index: i, sin: sin, cos: cos, tan: tan});
}

var _getPositions1 = function (inputs) {
    var properties = [];
    inputs.forEach(function (input, i) {
        properties.push({
            x: input.index,
            y: input.cos * 1000,
        });
    });
};


var _getPositions2 = function (inputs) {
    var properties = [];
    inputs.forEach(function (input, i) {
        properties.push({
            x: input.sin * 400,
            y: input.cos * 1000,
        });
    });
};

//create a new instance of AnimatedPoints passing in the total number of records (this must be declared up front and cannot be changed)
var animatedPoints = new AnimatedPoints(records.length);
animatedPoints.setProperties(_getPositions1(records));

//to animate to the next state, calculate a different set of positions for the data. Using a 2 seond delay as an example.
setTimeout(function () {
    animatedPoints.setProperties(_getPositions2(records));
}, 2000);
