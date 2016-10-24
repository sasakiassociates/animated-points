# animated-points
A GPU animated point cloud for three.js suitable for tweening large numbers of points

##Installation
`npm install --save animated-points`

##Usage
```Javascript
import AnimatedPoints from "animated-points";

//load the records (typically from a file or API call)
var records = [{type:'A', age:23},{type:'B', age:24}];

//create a new instance of AnimatedPoints passing in the total number of records (this must be declared up front and cannot be changed)
var animatedPoints = new AnimatedPoints(records.length);
animatedPoints.setProperties(_getPositions1(records));

//to animate to the next state, calculate a different set of positions for the data. Using a 2 seond delay as an example.
setTimeout(function() {
  animatedPoints.setProperties(_getPositions2(records));
}, 2000);

```