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

// Block materials
const grass = new THREE.MeshLambertMaterial({ color: 0x55aa33 });
const dirt = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
const stone = new THREE.MeshLambertMaterial({ color: 0x777777 });

// Selected block
let selectedMaterial = grass;

// Store all blocks
const blocks = [];

// Create block
function createBlock(x, y, z, material) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);
    scene.add(cube);
    blocks.push(cube);

    return cube;
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

// Mouse lock
renderer.domElement.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    mouseLocked = document.pointerLockElement === renderer.domElement;
});

// Mouse look
document.addEventListener("mousemove", (event) => {
    if (!mouseLocked) return;

    const sensitivity = 0.002;

    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

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

    // Select blocks
    if (event.code === "Digit1") selectedMaterial = grass;
    if (event.code === "Digit2") selectedMaterial = dirt;
    if (event.code === "Digit3") selectedMaterial = stone;
});

document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();

// Break block
function breakBlock() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const hits = raycaster.intersectObjects(blocks);

    if (hits.length === 0) return;

    const block = hits[0].object;

    // Don't let the player break blocks too far away
    if (hits[0].distance > 6) return;

    scene.remove(block);

    const index = blocks.indexOf(block);
    if (index !== -1) {
        blocks.splice(index, 1);
    }
}

// Place block
function placeBlock() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const hits = raycaster.intersectObjects(blocks);

    if (hits.length === 0) return;

    const hit = hits[0];

    if (hit.distance > 6) return;

    const normal = hit.face.normal;

    const position = hit.object.position.clone();

    position.x += normal.x;
    position.y += normal.y;
    position.z += normal.z;

    // Don't place a block inside the player
    const distanceToPlayer = position.distanceTo(camera.position);

    if (distanceToPlayer < 1.5) return;

    // Make sure there isn't already a block there
    for (const block of blocks) {
        if (block.position.distanceTo(position) < 0.1) {
            return;
        }
    }

    createBlock(
        Math.round(position.x),
        Math.round(position.y),
        Math.round(position.z),
        selectedMaterial
    );
}

// Mouse buttons
renderer.domElement.addEventListener("mousedown", (event) => {
    if (!mouseLocked) return;

    // Left click = break
    if (event.button === 0) {
        breakBlock();
    }

    // Right click = place
    if (event.button === 2) {
        placeBlock();
    }
});

// Stop right-click menu
renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

// Jump physics
let velocityY = 0;
let onGround = true;

const gravity = 0.012;
const jumpPower = 0.25;

// Game loop
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.08;

    // Movement
    if (keys["KeyW"]) camera.translateZ(-speed);
    if (keys["KeyS"]) camera.translateZ(speed);
    if (keys["KeyA"]) camera.translateX(-speed);
    if (keys["KeyD"]) camera.translateX(speed);

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

// Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
