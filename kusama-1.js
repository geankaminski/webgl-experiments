global.THREE = require("three");

require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glsl = require("glslify");

const settings = {
    animate: true,
    context: "webgl"
};

const sketch = ({ context }) => {
    const renderer = new THREE.WebGLRenderer({
        canvas: context.canvas
    });

    renderer.setClearColor("#fff", 1);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
    camera.position.set(0, 0, -4);
    camera.lookAt(new THREE.Vector3());

    const controls = new THREE.OrbitControls(camera, context.canvas);

    const scene = new THREE.Scene();

    const geometry = new THREE.SphereGeometry(1, 32, 16);

    const vertexShader = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `;

    const fragmentShader = glsl(/* glsl */`
        #pragma glslify: noise = require(glsl-noise/simplex/3d) 

        varying vec2 vUv;
        uniform vec3 color;
        uniform float time;

        void main() {
        vec2 center = vec2(0.5, 0.5);

        vec2 q = vUv;
        q.x *= 2.0;
        q *= 10.0;
        vec2 pos = mod(q, 1.0);

        float d = distance(pos, center);

        // float mask = step(0.25 + sin(time + vUv.x * 2.0) * 0.25, d);
        
        vec2 noiseInput = floor(q);
        float offset = noise(vec3(noiseInput.xy, time)) * 0.25;
        float mask = step(0.25 + offset, d);

        mask = 1.0 - mask;

        vec3 fragColor = mix(color, vec3(1.0), mask);

        gl_FragColor = vec4(vec3(fragColor), 1.0);
        }
  `);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color("tomato") }
        },
        vertexShader,
        fragmentShader
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return {
        resize({ pixelRatio, viewportWidth, viewportHeight }) {
            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(viewportWidth, viewportHeight, false);
            camera.aspect = viewportWidth / viewportHeight;
            camera.updateProjectionMatrix();
        },
        render({ time }) {
            material.uniforms.time.value = time;
            controls.update();
            renderer.render(scene, camera);
        },
        unload() {
            controls.dispose();
            renderer.dispose();
        }
    };
};

canvasSketch(sketch, settings);
