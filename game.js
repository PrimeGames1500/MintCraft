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

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 2));

// Blocks
const grass = new THREE.MeshLambertMaterial({ color: 0x55aa33 });
const dirt = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });

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

let mouseLocked = false;
let yaw = 0;
let pitch = 0;

// Click game to capture mouse
renderer.domElement.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
});

// Mouse lock
document.addEventListener("pointerlockchange", () => {
    mouseLocked = document.pointerLockElement === renderer.domElement;
});

// Mouse movement
document.addEventListener("mousemove", (event) => {
    if (!mouseLocked) return;

    const sensitivity = 0.002;

    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

    // Stop camera from flipping upside down
    pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pitch)
    );

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

// Keyboard
const keys = {};

document.addEventListener("keydown", (event) => {
    keys[event.code] = true;
});

document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

// Jump physics
let velocityY = 0;
let onGround = true;

const gravity = 0.012;
const jumpPower = 0.25;

function animate() {
    requestAnimationFrame(animate);

    const speed = 0.08;

    // WASD
    if (keys["KeyW"]) {
        camera.translateZ(-speed);
    }

    if (keys["KeyS"]) {
        camera.translateZ(speed);
    }

    if (keys["KeyA"]) {
        camera.translateX(-speed);
    }

    if (keys["KeyD"]) {
        camera.translateX(speed);
    }

    // Jump
    if (keys["Space"] && onGround) {
        velocityY = jumpPower;
        onGround = false;
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

// Window resizing
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
