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

scene.add(new THREE.AmbientLight(0xffffff, 1));

// Blocks
const grass = new THREE.MeshLambertMaterial({ color: 0x55aa33 });
const dirt = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });

function createBlock(x, y, z, material) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    scene.add(cube);
}

// World
for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
        createBlock(x, 0, z, grass);
        createBlock(x, -1, z, dirt);
    }
}

// Player
camera.position.set(0, 2, 5);

const controls = new PointerLockControls(camera, document.body);

// Click to lock mouse
document.addEventListener("click", () => {
    if (!controls.isLocked) {
        controls.lock();
    }
});

// Player controls
const keys = {};

document.addEventListener("keydown", (event) => {
    keys[event.code] = true;

    // Jump
    if (event.code === "Space" && onGround) {
        velocityY = 0.25;
        onGround = false;
    }
});

document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

// Physics
let velocityY = 0;
let onGround = true;

const gravity = 0.012;

function animate() {
    requestAnimationFrame(animate);

    const speed = 0.08;

    // Only move when mouse is locked
    if (controls.isLocked) {
        if (keys["KeyW"]) controls.moveForward(speed);
        if (keys["KeyS"]) controls.moveForward(-speed);
        if (keys["KeyA"]) controls.moveRight(-speed);
        if (keys["KeyD"]) controls.moveRight(speed);
    }

    // Gravity
    velocityY -= gravity;
    camera.position.y += velocityY;

    // Ground
    if (camera.position.y <= 2) {
        camera.position.y = 2;
        velocityY = 0;
        onGround = true;
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
