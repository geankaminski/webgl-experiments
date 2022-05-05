const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

const settings = {
  context: 'webgl',
  animate: true
};

const frag = glsl( /* glsl */`
  precision highp float;

  uniform float time;
  uniform float aspect;
  varying vec2 vUv;

  #pragma glslify: noise = require('glsl-noise/simplex/3d');
  #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

  void main () {
    // vec3 colorA = cos(time * 2.0) + vec3(1.0, 0.0, 0.0);
    // vec3 colorB = vec3(0.0, 0.5, 0.0);

    vec2 center = vUv - 0.5;
    center.x *= aspect;
    
    float dist = length(center);

    float alpha = smoothstep(0.251, 0.2505, dist);

    // vec3 color = mix(colorA, colorB, vUv.y + vUv.x * sin(time));
    // gl_FragColor = vec4(color, alpha);

    float n = noise(vec3(center * 10.0, time));

    vec3 color = hsl2rgb(vec3(n * 1.2, 0.5, 0.5));

    gl_FragColor = vec4(color, alpha);
  }
`);

const sketch = ({ gl }) => {
  return createShader({
    clearColor: 'white',
    gl,
    frag,
    uniforms: {
      time: ({ time }) => time,
      aspect: ({ width, height }) => width / height
    }
  });
};

canvasSketch(sketch, settings);
