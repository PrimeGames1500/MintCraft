import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// =========================
// SETUP
// =========================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

// =========================
// LIGHTING
// =========================

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(10, 20, 10);
scene.add(sunlight);

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    1.5
);

scene.add(ambientLight);

// =========================
// BLOCK TYPES
// =========================

const grassMaterial = new THREE.MeshLambertMaterial({
    color: 0x55aa33
});

const dirtMaterial = new THREE.MeshLambertMaterial({
    color: 0x8b5a2b
});

const stoneMaterial = new THREE.MeshLambertMaterial({
    color: 0x777777
});

// Currently selected block
let selectedMaterial = grassMaterial;

// =========================
// BLOCK STORAGE
// =========================

const blocks = [];

// =========================
// CREATE BLOCK
// =========================

function createBlock(x, y, z, material) {

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const cube = new THREE.Mesh(
        geometry,
        material
    );

    cube.position.set(x, y, z);

    scene.add(cube);

    blocks.push(cube);

    return cube;
}

// =========================
// CREATE WORLD
// =========================

for (let x = -10; x <= 10; x++) {

    for (let z = -10; z <= 10; z++) {

        // Grass
        createBlock(
            x,
            0,
            z,
            grassMaterial
        );

        // Dirt
        createBlock(
            x,
            -1,
            z,
            dirtMaterial
        );

        // Stone
        createBlock(
            x,
            -2,
            z,
            stoneMaterial
        );
    }
}

// =========================
// PLAYER
// =========================

camera.position.set(
    0,
    2,
    5
);

let yaw = 0;
let pitch = 0;

let mouseLocked = false;

// =========================
// MOUSE LOCK
// =========================

renderer.domElement.addEventListener(
    "click",
    () => {

        if (!mouseLocked) {

            renderer.domElement.requestPointerLock();

        }

    }
);

document.addEventListener(
    "pointerlockchange",
    () => {

        mouseLocked =
            document.pointerLockElement ===
            renderer.domElement;

    }
);

// =========================
// MOUSE LOOK
// =========================

document.addEventListener(
    "mousemove",
    (event) => {

        if (!mouseLocked) return;

        const sensitivity = 0.002;

        yaw -=
            event.movementX *
            sensitivity;

        pitch -=
            event.movementY *
            sensitivity;

        // Stop camera flipping
        pitch = Math.max(
            -Math.PI / 2,
            Math.min(
                Math.PI / 2,
                pitch
            )
        );

        camera.rotation.order = "YXZ";

        camera.rotation.y = yaw;

        camera.rotation.x = pitch;

    }
);

// =========================
// KEYBOARD
// =========================

const keys = {};

document.addEventListener(
    "keydown",
    (event) => {

        keys[event.code] = true;

        // Block selection
        if (event.code === "Digit1") {
            selectedMaterial = grassMaterial;
        }

        if (event.code === "Digit2") {
            selectedMaterial = dirtMaterial;
        }

        if (event.code === "Digit3") {
            selectedMaterial = stoneMaterial;
        }

    }
);

document.addEventListener(
    "keyup",
    (event) => {

        keys[event.code] = false;

    }
);

// =========================
// BLOCK RAYCASTING
// =========================

const raycaster =
    new THREE.Raycaster();

const screenCenter =
    new THREE.Vector2(0, 0);

function getTargetBlock() {

    raycaster.setFromCamera(
        screenCenter,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            blocks,
            false
        );

    if (hits.length === 0) {
        return null;
    }

    if (hits[0].distance > 6) {
        return null;
    }

    return hits[0];
}

// =========================
// BREAK BLOCK
// =========================

function breakBlock() {

    const hit =
        getTargetBlock();

    if (!hit) return;

    const block =
        hit.object;

    scene.remove(block);

    const index =
        blocks.indexOf(block);

    if (index !== -1) {

        blocks.splice(
            index,
            1
        );

    }

}

// =========================
// PLACE BLOCK
// =========================

function placeBlock() {

    const hit =
        getTargetBlock();

    if (!hit) return;

    const block =
        hit.object;

    const normal =
        hit.face.normal.clone();

    const position =
        block.position.clone();

    position.add(normal);

    position.x =
        Math.round(position.x);

    position.y =
        Math.round(position.y);

    position.z =
        Math.round(position.z);

    // Don't put block inside player
    if (
        position.distanceTo(
            camera.position
        ) < 1.5
    ) {
        return;
    }

    // Don't create duplicate block
    for (
        const existingBlock
        of blocks
    ) {

        if (
            existingBlock.position
                .distanceTo(position) < 0.1
        ) {

            return;

        }

    }

    createBlock(
        position.x,
        position.y,
        position.z,
        selectedMaterial
    );

}

// =========================
// MOUSE BUTTONS
// =========================

renderer.domElement.addEventListener(
    "mousedown",
    (event) => {

        if (!mouseLocked) return;

        // Left click
        if (event.button === 0) {

            breakBlock();

        }

        // Right click
        if (event.button === 2) {

            placeBlock();

        }

    }
);

// Stop right-click menu
renderer.domElement.addEventListener(
    "contextmenu",
    (event) => {

        event.preventDefault();

    }
);

// =========================
// JUMPING
// =========================

let velocityY = 0;

let onGround = true;

const gravity = 0.012;

const jumpPower = 0.25;

// =========================
// GAME LOOP
// =========================

function animate() {

    requestAnimationFrame(
        animate
    );

    const speed = 0.08;

    // Movement
    if (keys["KeyW"]) {

        camera.translateZ(
            -speed
        );

    }

    if (keys["KeyS"]) {

        camera.translateZ(
            speed
        );

    }

    if (keys["KeyA"]) {

        camera.translateX(
            -speed
        );

    }

    if (keys["KeyD"]) {

        camera.translateX(
            speed
        );

    }

    // Jump
    if (
        keys["Space"] &&
        onGround
    ) {

        velocityY =
            jumpPower;

        onGround = false;

    }

    // Gravity
    velocityY -= gravity;

    camera.position.y +=
        velocityY;

    // Ground
    if (
        camera.position.y <= 2
    ) {

        camera.position.y = 2;

        velocityY = 0;

        onGround = true;

    }

    renderer.render(
        scene,
        camera
    );

}

// Start game
animate();

// =========================
// WINDOW RESIZE
// =========================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);
