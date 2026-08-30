import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(10, 20, 10);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

// Block materials
const grass = new THREE.MeshLambertMaterial({color: 0x55aa33});
const dirt = new THREE.MeshLambertMaterial({color: 0x8b5a2b});

// Make a block
function block(x, y, z, material) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);
    scene.add(cube);
}

// Make the world
for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
        block(x, 0, z, grass);
        block(x, -1, z, dirt);
    }
}

// Camera
camera.position.set(0, 3, 8);

// Simple movement
const keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

function animate() {
    requestAnimationFrame(animate);

    if (keys["w"]) camera.position.z -= 0.1;
    if (keys["s"]) camera.position.z += 0.1;
    if (keys["a"]) camera.position.x -= 0.1;
    if (keys["d"]) camera.position.x += 0.1;

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
