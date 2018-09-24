attribute float size_from;
attribute float size_to;

attribute float r_from;
attribute float g_from;
attribute float b_from;
attribute float a_from;

attribute float r_to;
attribute float g_to;
attribute float b_to;
attribute float a_to;

attribute vec3 position_to;

varying vec4 vColor;
uniform float animationPos;
uniform float scale;

void main() {
    vColor = vec4(
        r_from * (1.0 - animationPos) + r_to * animationPos,
        g_from * (1.0 - animationPos) + g_to * animationPos,
        b_from * (1.0 - animationPos) + b_to * animationPos,
        a_from * (1.0 - animationPos) + a_to * animationPos
    );
    vec4 mvPosition = modelViewMatrix * vec4(position * (1.0 - animationPos) + position_to * animationPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float pointSize = size_from * (1.0 - animationPos) + size_to * animationPos;
    if (scale > 0.0) {
        gl_PointSize = pointSize * (scale / length( mvPosition.xyz ));
    } else {
        gl_PointSize = pointSize;
    }
}