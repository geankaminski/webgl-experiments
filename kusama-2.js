global.THREE = require("three");

require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glsl = require("glslify");
const Random = require("canvas-sketch-util/random");

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

    const baseGeom = new THREE.IcosahedronGeometry(1, 1);
    let points = [];
    const positionAttribute = baseGeom.getAttribute('position');
    const vertex = new THREE.Vector3();
    for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++) {
        vertex.fromBufferAttribute(positionAttribute, vertexIndex);
        points.push(vertex.clone());
    }

    const circleGeom = new THREE.CircleGeometry(1, 32);
    points.forEach(point => {
        const mesh = new THREE.Mesh(
            circleGeom,
            new THREE.MeshBasicMaterial({
                color: "black",
                side: THREE.BackSide
            })
        );
        mesh.position.copy(point);
        mesh.scale.setScalar(0.1 * Random.value(0.1, 1));
        mesh.lookAt(new THREE.Vector3());
        scene.add(mesh);
    });

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
            gl_FragColor = vec4(vec3(color), 1.0);
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
