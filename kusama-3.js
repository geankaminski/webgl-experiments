global.THREE = require("three");

require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glsl = require("glslify");
const Random = require("canvas-sketch-util/random");

const settings = {
    duration: 10,
    fps: 60,
    dimensions: [1080, 1080],
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

    const vertexShader = /* glsl */`
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
        }
    `;

    const fragmentShader = glsl(/* glsl */`
        #pragma glslify: noise = require(glsl-noise/simplex/3d);
        #pragma glslify: aastep = require(glsl-aastep);

        varying vec2 vUv;
        varying vec3 vPosition;

        uniform vec3 color;
        uniform float time;

        uniform vec3 points[POINT_COUNT];

        uniform mat4 modelMatrix;

        float sphereRim (vec3 spherePosition) {
            vec3 normal = normalize(spherePosition.xyz);
            vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
            vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
            vec3 V = normalize(cameraPosition - worldPosition);
            float rim = 1.0 - max(dot(V, worldNormal), 0.0);
            return pow(smoothstep(0.0, 1.0, rim), 0.5);
        }

        void main() {
            float dist = 10000.0;
            
            for (int i = 0; i < POINT_COUNT; i++) {
                vec3 p = points[i];
                float d = distance(vPosition , p);
                dist = min(d, dist);
            }

            float mask = aastep(0.15, dist);
            mask = 1.0 - mask;

            vec3 fragColor = mix(color, vec3(1.0), mask);

            float rim = sphereRim(vPosition);
            fragColor += rim * 0.25;

            gl_FragColor = vec4(vec3(fragColor), 1.0);
        } 
        `);

    const material = new THREE.ShaderMaterial({
        defines: {
            POINT_COUNT: points.length
        },
        extensions: {
            derivatives: true
        },
        uniforms: {
            points: { value: points },
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
        render({ time, playhead }) {
            mesh.rotation.y = playhead * Math.PI * 2;
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
