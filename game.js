import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// =====================================================
// MINTCRAFT
// =====================================================

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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

// =====================================================
// LIGHT
// =====================================================

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 10);
scene.add(sun);

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.5
    )
);

// =====================================================
// BLOCK TYPES
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

const woodMaterial = new THREE.MeshLambertMaterial({
    color: 0x6b421f
});

const leavesMaterial = new THREE.MeshLambertMaterial({
    color: 0x2f8f35
});

let selectedMaterial = grassMaterial;

// =====================================================
// BLOCKS
// =====================================================

const blocks = [];

function createBlock(x, y, z, material) {

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const block = new THREE.Mesh(
        geometry,
        material
    );

    block.position.set(x, y, z);

    scene.add(block);
    blocks.push(block);

    return block;
}

// =====================================================
// RANDOM SEED
// =====================================================

const seed = Math.floor(
    Math.random() * 1000000000
);

console.log("MintCraft Seed:", seed);

function randomNoise(x, z) {

    const value = Math.sin(
        x * 127.1 +
        z * 311.7 +
        seed
    ) * 43758.5453;

    return value - Math.floor(value);
}

// =====================================================
// TERRAIN
// =====================================================

function getHeight(x, z) {

    const hills =
        Math.sin((x + seed) * 0.12) * 3;

    const valleys =
        Math.cos((z - seed) * 0.11) * 3;

    const smaller =
        Math.sin((x + z) * 0.2) * 1.5;

    let height =
        5 +
        hills +
        valleys +
        smaller;

    return Math.max(
        1,
        Math.min(10, Math.round(height))
    );
}

// =====================================================
// TREES
// =====================================================

function createTree(x, y, z) {

    for (let i = 0; i < 4; i++) {

        createBlock(
            x,
            y + i,
            z,
            woodMaterial
        );

    }

    for (let lx = -2; lx <= 2; lx++) {

        for (let lz = -2; lz <= 2; lz++) {

            for (let ly = 2; ly <= 4; ly++) {

                if (
                    Math.abs(lx) +
                    Math.abs(lz) <= 3
                ) {

                    createBlock(
                        x + lx,
                        y + ly,
                        z + lz,
                        leavesMaterial
                    );

                }

            }

        }

    }

    createBlock(
        x,
        y + 5,
        z,
        leavesMaterial
    );
}

// =====================================================
// WORLD GENERATION
// =====================================================

const WORLD_SIZE = 25;

for (
    let x = -WORLD_SIZE;
    x <= WORLD_SIZE;
    x++
) {

    for (
        let z = -WORLD_SIZE;
        z <= WORLD_SIZE;
        z++
    ) {

        const height =
            getHeight(x, z);

        for (
            let y = -4;
            y < height;
            y++
        ) {

            let material;

            if (
                y === height - 1
            ) {

                material = grassMaterial;

            } else if (
                y >= height - 4
            ) {

                material = dirtMaterial;

            } else {

                material = stoneMaterial;

            }

            createBlock(
                x,
                y,
                z,
                material
            );

        }

        if (
            randomNoise(x, z) > 0.97 &&
            height >= 3 &&
            Math.abs(x) > 3 &&
            Math.abs(z) > 3
        ) {

            createTree(
                x,
                height,
                z
            );

        }

    }

}

// =====================================================
// PLAYER
// =====================================================

const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.3;

camera.position.set(
    0,
    getHeight(0, 5) + 3,
    5
);

let velocityY = 0;
let grounded = false;

const gravity = 0.015;
const jumpPower = 0.27;

// =====================================================
// KEYBOARD
// =====================================================

const keys = {};

document.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;

        if (event.code === "Digit1") {
            selectedMaterial = grassMaterial;
            updateHotbar();
        }

        if (event.code === "Digit2") {
            selectedMaterial = dirtMaterial;
            updateHotbar();
        }

        if (event.code === "Digit3") {
            selectedMaterial = stoneMaterial;
            updateHotbar();
        }

        if (event.code === "Digit4") {
            selectedMaterial = woodMaterial;
            updateHotbar();
        }

        if (event.code === "Digit5") {
            selectedMaterial = leavesMaterial;
            updateHotbar();
        }

    }
);

document.addEventListener(
    "keyup",
    event => {
        keys[event.code] = false;
    }
);

// =====================================================
// MOUSE LOOK
// =====================================================

let mouseLocked = false;
let yaw = 0;
let pitch = 0;

renderer.domElement.addEventListener(
    "click",
    () => {

        renderer.domElement.requestPointerLock();

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
    event => {

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
            Math.min(Math.PI / 2, pitch)
        );

        camera.rotation.order = "YXZ";

        camera.rotation.y = yaw;
        camera.rotation.x = pitch;

    }
);

// =====================================================
// COLLISION HELPERS
// =====================================================

function blockAt(x, y, z) {

    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);

    for (const block of blocks) {

        if (
            Math.round(block.position.x) === bx &&
            Math.round(block.position.y) === by &&
            Math.round(block.position.z) === bz
        ) {

            return block;

        }

    }

    return null;
}

function groundHeight(x, z) {

    const bx = Math.floor(x);
    const bz = Math.floor(z);

    let highest = -100;

    for (const block of blocks) {

        if (
            Math.round(block.position.x) === bx &&
            Math.round(block.position.z) === bz
        ) {

            highest = Math.max(
                highest,
                block.position.y + 0.5
            );

        }

    }

    return highest;
}

// =====================================================
// MOVEMENT
// =====================================================

function tryMove(dx, dz) {

    const oldX = camera.position.x;
    const oldZ = camera.position.z;

    camera.position.x += dx;

    if (
        blockAt(
            camera.position.x,
            camera.position.y - 0.5,
            camera.position.z
        )
    ) {

        camera.position.x = oldX;

    }

    camera.position.z += dz;

    if (
        blockAt(
            camera.position.x,
            camera.position.y - 0.5,
            camera.position.z
        )
    ) {

        camera.position.z = oldZ;

    }

}

// =====================================================
// PHYSICS
// =====================================================

function updatePhysics() {

    const ground =
        groundHeight(
            camera.position.x,
            camera.position.z
        );

    const feet =
        camera.position.y -
        PLAYER_HEIGHT / 2;

    // Falling
    if (feet > ground) {

        velocityY -= gravity;

        camera.position.y += velocityY;

        grounded = false;

    }

    // Landing
    if (
        camera.position.y -
        PLAYER_HEIGHT / 2 <= ground
    ) {

        camera.position.y =
            ground +
            PLAYER_HEIGHT / 2;

        velocityY = 0;

        grounded = true;

    }

    // Jump
    if (
        keys["Space"] &&
        grounded
    ) {

        velocityY =
            jumpPower;

        grounded = false;

    }

}

// =====================================================
// CROSSHAIR
// =====================================================

const crosshair =
    document.createElement("div");

crosshair.innerText = "+";

crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";

crosshair.style.transform =
    "translate(-50%, -50%)";

crosshair.style.color = "white";
crosshair.style.fontSize = "30px";
crosshair.style.fontWeight = "bold";

crosshair.style.textShadow =
    "2px 2px 2px black";

crosshair.style.pointerEvents =
    "none";

crosshair.style.zIndex = "20";

document.body.appendChild(
    crosshair
);

// =====================================================
// HOTBAR
// =====================================================

const hotbar =
    document.createElement("div");

hotbar.style.position = "fixed";
hotbar.style.bottom = "20px";
hotbar.style.left = "50%";

hotbar.style.transform =
    "translateX(-50%)";

hotbar.style.display = "flex";
hotbar.style.gap = "4px";

hotbar.style.padding = "6px";

hotbar.style.background =
    "rgba(20,20,20,0.8)";

hotbar.style.zIndex = "20";

document.body.appendChild(
    hotbar
);

const hotbarData = [

    {
        key: "1",
        material: grassMaterial,
        color: "#55aa33"
    },

    {
        key: "2",
        material: dirtMaterial,
        color: "#8b5a2b"
    },

    {
        key: "3",
        material: stoneMaterial,
        color: "#777777"
    },

    {
        key: "4",
        material: woodMaterial,
        color: "#6b421f"
    },

    {
        key: "5",
        material: leavesMaterial,
        color: "#2f8f35"
    }

];

const hotbarSlots = [];

for (const item of hotbarData) {

    const slot =
        document.createElement("div");

    slot.style.width = "60px";
    slot.style.height = "60px";

    slot.style.background = "#333";

    slot.style.border =
        "3px solid #777";

    slot.style.position = "relative";

    slot.style.display = "flex";

    slot.style.alignItems =
        "center";

    slot.style.justifyContent =
        "center";

    const preview =
        document.createElement("div");

    preview.style.width = "38px";
    preview.style.height = "38px";

    preview.style.background =
        item.color;

    preview.style.border =
        "2px solid #111";

    slot.appendChild(preview);

    const number =
        document.createElement("div");

    number.innerText =
        item.key;

    number.style.position =
        "absolute";

    number.style.left = "4px";
    number.style.bottom = "2px";

    number.style.color = "white";
    number.style.fontWeight = "bold";

    slot.appendChild(number);

    slot.onclick = () => {

        selectedMaterial =
            item.material;

        updateHotbar();

    };

    hotbar.appendChild(slot);
    hotbarSlots.push(slot);

}

function updateHotbar() {

    hotbarSlots.forEach(
        (slot, index) => {

            if (
                hotbarData[index].material ===
                selectedMaterial
            ) {

                slot.style.border =
                    "4px solid white";

            } else {

                slot.style.border =
                    "3px solid #777";

            }

        }
    );

}

updateHotbar();

// =====================================================
// BLOCK HIGHLIGHT
// =====================================================

const raycaster =
    new THREE.Raycaster();

const center =
    new THREE.Vector2(0, 0);

let highlight = null;

function updateHighlight() {

    raycaster.setFromCamera(
        center,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            blocks,
            false
        );

    if (
        hits.length === 0 ||
        hits[0].distance > 6
    ) {

        if (highlight) {

            scene.remove(
                highlight
            );

            highlight = null;

        }

        return;

    }

    const block =
        hits[0].object;

    if (!highlight) {

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

        highlight =
            new THREE.LineSegments(
                edges,
                material
            );

        scene.add(
            highlight
        );

    }

    highlight.position.copy(
        block.position
    );

}

// =====================================================
// BREAK / PLACE
// =====================================================

function getTarget() {

    raycaster.setFromCamera(
        center,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            blocks,
            false
        );

    if (
        hits.length === 0
    ) {

        return null;

    }

    if (
        hits[0].distance > 6
    ) {

        return null;

    }

    return hits[0];

}

function breakBlock() {

    const hit = getTarget();

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

function placeBlock() {

    const hit = getTarget();

    if (!hit) return;

    const position =
        hit.object.position.clone();

    position.add(
        hit.face.normal
    );

    position.x =
        Math.round(position.x);

    position.y =
        Math.round(position.y);

    position.z =
        Math.round(position.z);

    // Don't place inside player
    if (
        Math.abs(
            position.x -
            camera.position.x
        ) < 0.8 &&
        Math.abs(
            position.z -
            camera.position.z
        ) < 0.8 &&
        Math.abs(
            position.y -
            camera.position.y
        ) < 1.8
    ) {

        return;

    }

    if (
        blockAt(
            position.x,
            position.y,
            position.z
        )
    ) {

        return;

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
    event => {

        if (!mouseLocked) return;

        if (event.button === 0) {

            breakBlock();

        }

        if (event.button === 2) {

            placeBlock();

        }

    }
);

renderer.domElement.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);

// =====================================================
// MAIN GAME LOOP
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );

    const speed = 0.08;

    let forward = 0;
    let right = 0;

    if (keys["KeyW"]) {
        forward += speed;
    }

    if (keys["KeyS"]) {
        forward -= speed;
    }

    if (keys["KeyD"]) {
        right += speed;
    }

    if (keys["KeyA"]) {
        right -= speed;
    }

    // Movement relative to camera direction
    const moveX =
        Math.sin(yaw) * forward +
        Math.cos(yaw) * right;

    const moveZ =
        Math.cos(yaw) * forward -
        Math.sin(yaw) * right;

    tryMove(
        moveX,
        moveZ
    );

    updatePhysics();

    updateHighlight();

    renderer.render(
        scene,
        camera
    );

}

animate();

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
