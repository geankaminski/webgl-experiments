global.THREE = require("three");

require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const { Mesh } = require("three");

const settings = {
  animate: true,
  context: "webgl"
};

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  renderer.setClearColor("black", 1);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(3, 3, -5);
  camera.lookAt(new THREE.Vector3());

  const controls = new THREE.OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(1, 32, 16);

  const loader = new THREE.TextureLoader();
  const earthTexture = loader.load(
    "earth.jpg"
  );
  const moonTexture = loader.load(
    "moon.jpg"
  );

  const earthMaterial = new THREE.MeshStandardMaterial({
    roughness: 1,
    metalness: 0,
    map: earthTexture,
  });

  const earthMesh = new THREE.Mesh(geometry, earthMaterial);
  scene.add(earthMesh);

  const moonGroup = new THREE.Group();
  const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 1,
    metalness: 0,
  });
  const moonMesh = new THREE.Mesh(geometry, moonMaterial);
  moonMesh.position.set(1.5, 1, 0);
  moonMesh.scale.setScalar(0.25);
  moonGroup.add(moonMesh);

  scene.add(moonGroup);

  const light = new THREE.PointLight("white", 2);
  light.position.set(1, 1, 0);
  scene.add(light);

  /* scene.add(new THREE.GridHelper(5, 50));
  scene.add(new THREE.PointLightHelper(light, 0.15)); */

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time }) {
      earthMesh.rotation.y = time * 0.15;
      moonMesh.rotation.y = time * 0.075;
      moonGroup.rotation.y = time * 0.5;
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
