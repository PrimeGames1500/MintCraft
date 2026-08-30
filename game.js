import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/controls/PointerLockControls.js";

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
document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.HemisphereLight(0xffffff, 0x555555, 2);
scene.add(light);

// Block materials
const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
const dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

// Create a block
function createBlock(x, y, z, material) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const block = new THREE.Mesh(geometry, material);

    block.position.set(x, y, z);
    scene.add(block);
}

// Create a small world
for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
        createBlock(x, 0, z, grassMaterial);
        createBlock(x, -1, z, dirtMaterial);
    }
}

// Player
camera.position.set(0, 2, 5);

const controls = new PointerLockControls(camera, renderer.domElement);

document.addEventListener("click", () => {
    controls.lock();
});

// Movement
const keys = {};

document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

function animate() {
    requestAnimationFrame(animate);

    const speed = 0.1;

    if (keys["w"]) controls.moveForward(speed);
    if (keys["s"]) controls.moveForward(-speed);
    if (keys["a"]) controls.moveRight(-speed);
    if (keys["d"]) controls.moveRight(speed);

    renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
