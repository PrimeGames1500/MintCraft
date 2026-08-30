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
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(10, 20, 10);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

// Block materials
const grass = new THREE.MeshLambertMaterial({ color: 0x55aa33 });
const dirt = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });

// Create blocks
function createBlock(x, y, z, material) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);
    scene.add(cube);
}

// Create world
for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
        createBlock(x, 0, z, grass);
        createBlock(x, -1, z, dirt);
    }
}

// Player
camera.position.set(0, 2, 5);

const controls = new PointerLockControls(camera, document.body);

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

// Physics
let velocityY = 0;
let onGround = false;

const gravity = 0.015;
const jumpPower = 0.25;

function animate() {
    requestAnimationFrame(animate);

    const speed = 0.08;

    // WASD movement
    if (keys["w"]) controls.moveForward(speed);
    if (keys["s"]) controls.moveForward(-speed);
    if (keys["a"]) controls.moveRight(-speed);
    if (keys["d"]) controls.moveRight(speed);

    // Gravity
    velocityY -= gravity;
    camera.position.y += velocityY;

    // Ground
    if (camera.position.y <= 2) {
        camera.position.y = 2;
        velocityY = 0;
        onGround = true;
    } else {
        onGround = false;
    }

    // Jump
    if (keys[" "] && onGround) {
        velocityY = jumpPower;
        onGround = false;
    }

    renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
