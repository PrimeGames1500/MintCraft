import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// =====================================================
// SETUP
// =====================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

renderer.domElement.style.display = "block";

// =====================================================
// LIGHTING
// =====================================================

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(10, 20, 10);
scene.add(sunlight);

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    1.5
);

scene.add(ambientLight);

// =====================================================
// BLOCK MATERIALS
// =====================================================

const grassMaterial = new THREE.MeshLambertMaterial({
    color: 0x55aa33
});

const dirtMaterial = new THREE.MeshLambertMaterial({
    color: 0x8b5a2b
});

const stoneMaterial = new THREE.MeshLambertMaterial({
    color: 0x777777
});

let selectedMaterial = grassMaterial;
let selectedBlockName = "Grass";

// =====================================================
// BLOCK STORAGE
// =====================================================

const blocks = [];

// =====================================================
// CREATE BLOCK
// =====================================================

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

// =====================================================
// CREATE WORLD
// =====================================================

for (let x = -15; x <= 15; x++) {

    for (let z = -15; z <= 15; z++) {

        createBlock(
            x,
            0,
            z,
            grassMaterial
        );

        createBlock(
            x,
            -1,
            z,
            dirtMaterial
        );

        createBlock(
            x,
            -2,
            z,
            stoneMaterial
        );

    }
}

// =====================================================
// CROSSHAIR
// =====================================================

const crosshair = document.createElement("div");

crosshair.innerHTML = "+";

crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";
crosshair.style.transform = "translate(-50%, -50%)";

crosshair.style.color = "white";
crosshair.style.fontSize = "32px";
crosshair.style.fontFamily = "Arial, sans-serif";
crosshair.style.fontWeight = "bold";

crosshair.style.textShadow =
    "2px 2px 2px black, -2px -2px 2px black";

crosshair.style.pointerEvents = "none";
crosshair.style.zIndex = "10";

document.body.appendChild(crosshair);

// =====================================================
// HOTBAR
// =====================================================

const hotbar = document.createElement("div");

hotbar.style.position = "fixed";
hotbar.style.bottom = "20px";
hotbar.style.left = "50%";
hotbar.style.transform = "translateX(-50%)";

hotbar.style.display = "flex";
hotbar.style.gap = "4px";

hotbar.style.background = "rgba(20,20,20,0.75)";
hotbar.style.padding = "6px";

hotbar.style.border = "3px solid #222";
hotbar.style.zIndex = "10";

document.body.appendChild(hotbar);

const hotbarBlocks = [
    {
        number: "1",
        name: "Grass",
        material: grassMaterial,
        color: "#55aa33"
    },
    {
        number: "2",
        name: "Dirt",
        material: dirtMaterial,
        color: "#8b5a2b"
    },
    {
        number: "3",
        name: "Stone",
        material: stoneMaterial,
        color: "#777777"
    }
];

const hotbarSlots = [];

for (const item of hotbarBlocks) {

    const slot = document.createElement("div");

    slot.style.width = "60px";
    slot.style.height = "60px";

    slot.style.background = "#333";

    slot.style.border = "3px solid #777";

    slot.style.display = "flex";
    slot.style.alignItems = "center";
    slot.style.justifyContent = "center";

    slot.style.position = "relative";

    slot.style.fontFamily = "Arial";
    slot.style.color = "white";

    slot.style.cursor = "pointer";

    // Block preview
    const preview = document.createElement("div");

    preview.style.width = "38px";
    preview.style.height = "38px";

    preview.style.background = item.color;

    preview.style.border = "2px solid #222";

    slot.appendChild(preview);

    // Number
    const number = document.createElement("div");

    number.innerText = item.number;

    number.style.position = "absolute";
    number.style.bottom = "2px";
    number.style.left = "4px";

    number.style.fontWeight = "bold";
    number.style.fontSize = "18px";

    slot.appendChild(number);

    slot.addEventListener("click", () => {

        selectedMaterial = item.material;
        selectedBlockName = item.name;

        updateHotbar();

    });

    hotbar.appendChild(slot);

    hotbarSlots.push(slot);
}

function updateHotbar() {

    hotbarSlots.forEach((slot, index) => {

        if (
            hotbarBlocks[index].material ===
            selectedMaterial
        ) {

            slot.style.border = "4px solid white";

            slot.style.boxShadow =
                "0 0 10px white";

        } else {

            slot.style.border = "3px solid #777";

            slot.style.boxShadow = "none";

        }

    });

}

updateHotbar();

// =====================================================
// BLOCK HIGHLIGHT
// =====================================================

let highlightedBlock = null;

let highlightBox = null;

function createHighlight(block) {

    if (highlightBox) {

        scene.remove(highlightBox);

        highlightBox.geometry.dispose();

    }

    const geometry =
        new THREE.BoxGeometry(
            1.04,
            1.04,
            1.04
        );

    const edges =
        new THREE.EdgesGeometry(
            geometry
        );

    const material =
        new THREE.LineBasicMaterial({
            color: 0xffffff
        });

    highlightBox =
        new THREE.LineSegments(
            edges,
            material
        );

    highlightBox.position.copy(
        block.position
    );

    scene.add(highlightBox);

}

function removeHighlight() {

    if (highlightBox) {

        scene.remove(highlightBox);

        highlightBox.geometry.dispose();

        highlightBox.material.dispose();

        highlightBox = null;

    }

    highlightedBlock = null;

}

// =====================================================
// MOUSE LOOK
// =====================================================

let mouseLocked = false;

let yaw = 0;
let pitch = 0;

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

        pitch = Math.max(
            -Math.PI / 2,
            Math.min(
                Math.PI / 2,
                pitch
            )
        );

        camera.rotation.order =
            "YXZ";

        camera.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;

    }
);

// =====================================================
// KEYBOARD
// =====================================================

const keys = {};

document.addEventListener(
    "keydown",
    (event) => {

        keys[event.code] = true;

        if (event.code === "Digit1") {

            selectedMaterial =
                grassMaterial;

            selectedBlockName =
                "Grass";

            updateHotbar();

        }

        if (event.code === "Digit2") {

            selectedMaterial =
                dirtMaterial;

            selectedBlockName =
                "Dirt";

            updateHotbar();

        }

        if (event.code === "Digit3") {

            selectedMaterial =
                stoneMaterial;

            selectedBlockName =
                "Stone";

            updateHotbar();

        }

    }
);

document.addEventListener(
    "keyup",
    (event) => {

        keys[event.code] = false;

    }
);

// =====================================================
// RAYCASTING
// =====================================================

const raycaster =
    new THREE.Raycaster();

const center =
    new THREE.Vector2(0, 0);

function getTargetBlock() {

    raycaster.setFromCamera(
        center,
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

// =====================================================
// UPDATE HIGHLIGHT
// =====================================================

function updateHighlight() {

    const hit =
        getTargetBlock();

    if (!hit) {

        removeHighlight();

        return;

    }

    const block =
        hit.object;

    if (
        highlightedBlock !== block
    ) {

        highlightedBlock =
            block;

        createHighlight(block);

    }

    if (highlightBox) {

        highlightBox.position.copy(
            block.position
        );

    }

}

// =====================================================
// BREAK BLOCK
// =====================================================

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

    if (
        highlightedBlock ===
        block
    ) {

        removeHighlight();

    }

}

// =====================================================
// PLACE BLOCK
// =====================================================

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

    // Don't place inside player
    if (
        position.distanceTo(
            camera.position
        ) < 1.5
    ) {

        return;

    }

    // Check for duplicate blocks
    for (
        const existingBlock
        of blocks
    ) {

        if (
            existingBlock.position
                .distanceTo(position)
                < 0.1
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

// =====================================================
// MOUSE BUTTONS
// =====================================================

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

// Prevent right-click menu
renderer.domElement.addEventListener(
    "contextmenu",
    (event) => {

        event.preventDefault();

    }
);

// =====================================================
// JUMPING
// =====================================================

let velocityY = 0;

let onGround = true;

const gravity = 0.012;

const jumpPower = 0.25;

// =====================================================
// GAME LOOP
// =====================================================

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

    // Highlight block
    updateHighlight();

    renderer.render(
        scene,
        camera
    );

}

// =====================================================
// RESIZE
// =====================================================

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

// =====================================================
// START
// =====================================================

animate();
