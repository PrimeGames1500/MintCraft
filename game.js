import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// =====================================================
// MINTCRAFT V2
// =====================================================

// -------------------------
// Scene
// -------------------------

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

// -------------------------
// Lighting
// -------------------------

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(20, 30, 10);
scene.add(sunlight);

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.5
    )
);

// =====================================================
// RANDOM SEED
// =====================================================

const seed = Math.floor(Math.random() * 1000000000);

console.log("MintCraft Seed:", seed);

// Seeded random number
function seededRandom(x, z) {

    const value =
        Math.sin(
            x * 127.1 +
            z * 311.7 +
            seed * 0.001
        ) * 43758.5453123;

    return value - Math.floor(value);
}

// =====================================================
// BLOCK MATERIALS
// =====================================================

const grassMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x55aa33
    });

const dirtMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x8b5a2b
    });

const stoneMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x777777
    });

const woodMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x6b421f
    });

const leavesMaterial =
    new THREE.MeshLambertMaterial({
        color: 0x2f8f35
    });

let selectedMaterial = grassMaterial;

// =====================================================
// BLOCK STORAGE
// =====================================================

const blocks = [];

// =====================================================
// BLOCK CREATION
// =====================================================

function createBlock(x, y, z, material) {

    const geometry =
        new THREE.BoxGeometry(1, 1, 1);

    const block =
        new THREE.Mesh(
            geometry,
            material
        );

    block.position.set(
        x,
        y,
        z
    );

    scene.add(block);
    blocks.push(block);

    return block;
}

// =====================================================
// TERRAIN
// =====================================================

function getHeight(x, z) {

    const large =
        Math.sin(
            (x + seed) * 0.08
        ) * 3;

    const medium =
        Math.cos(
            (z - seed) * 0.09
        ) * 3;

    const small =
        Math.sin(
            (x + z + seed) * 0.18
        ) * 1.5;

    let height =
        4 +
        large +
        medium +
        small;

    height =
        Math.round(height);

    return Math.max(
        1,
        Math.min(10, height)
    );
}

// =====================================================
// TREE
// =====================================================

function createTree(x, y, z) {

    // Trunk
    for (let i = 0; i < 4; i++) {

        createBlock(
            x,
            y + i,
            z,
            woodMaterial
        );

    }

    // Leaves
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

        // Underground blocks
        for (
            let y = -4;
            y < height;
            y++
        ) {

            let material;

            if (
                y === height - 1
            ) {

                material =
                    grassMaterial;

            } else if (
                y >= height - 4
            ) {

                material =
                    dirtMaterial;

            } else {

                material =
                    stoneMaterial;

            }

            createBlock(
                x,
                y,
                z,
                material
            );

        }

        // Trees
        const random =
            seededRandom(x, z);

        if (
            random > 0.965 &&
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

const player = {
    width: 0.6,
    height: 1.8,
    depth: 0.6
};

camera.position.set(
    0,
    getHeight(0, 0) + 2,
    5
);

// Vertical velocity
let velocityY = 0;

let onGround = false;

const gravity = 0.015;
const jumpPower = 0.27;

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
    event => {

        keys[event.code] = true;

        if (
            event.code === "Digit1"
        ) {

            selectedMaterial =
                grassMaterial;

            updateHotbar();

        }

        if (
            event.code === "Digit2"
        ) {

            selectedMaterial =
                dirtMaterial;

            updateHotbar();

        }

        if (
            event.code === "Digit3"
        ) {

            selectedMaterial =
                stoneMaterial;

            updateHotbar();

        }

        if (
            event.code === "Digit4"
        ) {

            selectedMaterial =
                woodMaterial;

            updateHotbar();

        }

        if (
            event.code === "Digit5"
        ) {

            selectedMaterial =
                leavesMaterial;

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
// COLLISION
// =====================================================

function isSolidAt(x, y, z) {

    for (
        const block of blocks
    ) {

        const bx =
            Math.round(block.position.x);

        const by =
            Math.round(block.position.y);

        const bz =
            Math.round(block.position.z);

        if (
            bx === Math.floor(x) &&
            by === Math.floor(y) &&
            bz === Math.floor(z)
        ) {

            return true;

        }

    }

    return false;
}

// Find the top of the terrain below player
function getGroundHeight() {

    const px =
        Math.floor(camera.position.x);

    const pz =
        Math.floor(camera.position.z);

    let highest = -100;

    for (
        const block of blocks
    ) {

        const bx =
            Math.round(block.position.x);

        const bz =
            Math.round(block.position.z);

        if (
            bx === px &&
            bz === pz
        ) {

            highest =
                Math.max(
                    highest,
                    block.position.y + 0.5
                );

        }

    }

    return highest;
}

// =====================================================
// MOVEMENT COLLISION
// =====================================================

function movePlayer(dx, dz) {

    const oldX =
        camera.position.x;

    const oldZ =
        camera.position.z;

    // Move X
    camera.position.x += dx;

    const groundY =
        getGroundHeight();

    if (
        camera.position.y <
        groundY + 1.8
    ) {

        const checkY =
            camera.position.y - 0.9;

        if (
            isSolidAt(
                camera.position.x,
                checkY,
                camera.position.z
            )
        ) {

            camera.position.x =
                oldX;

        }

    }

    // Move Z
    camera.position.z += dz;

    if (
        camera.position.y <
        groundY + 1.8
    ) {

        const checkY =
            camera.position.y - 0.9;

        if (
            isSolidAt(
                camera.position.x,
                checkY,
                camera.position.z
            )
        ) {

            camera.position.z =
                oldZ;

        }

    }

}

// =====================================================
// PHYSICS
// =====================================================

function updatePhysics() {

    const ground =
        getGroundHeight();

    const playerBottom =
        camera.position.y -
        player.height / 2;

    // Falling
    if (
        playerBottom > ground
    ) {

        velocityY -= gravity;

        camera.position.y +=
            velocityY;

        onGround = false;

    }

    // Land
    if (
        camera.position.y -
        player.height / 2 <= ground
    ) {

        camera.position.y =
            ground +
            player.height / 2;

        velocityY = 0;

        onGround = true;

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

}

// =====================================================
// CROSSHAIR
// =====================================================

const crosshair =
    document.createElement("div");

crosshair.innerText = "+";

crosshair.style.position =
    "fixed";

crosshair.style.left =
    "50%";

crosshair.style.top =
    "50%";

crosshair.style.transform =
    "translate(-50%, -50%)";

crosshair.style.color =
    "white";

crosshair.style.fontSize =
    "30px";

crosshair.style.fontWeight =
    "bold";

crosshair.style.textShadow =
    "2px 2px 2px black";

crosshair.style.pointerEvents =
    "none";

crosshair.style.zIndex =
    "10";

document.body.appendChild(
    crosshair
);

// =====================================================
// HOTBAR
// =====================================================

const hotbar =
    document.createElement("div");

hotbar.style.position =
    "fixed";

hotbar.style.bottom =
    "20px";

hotbar.style.left =
    "50%";

hotbar.style.transform =
    "translateX(-50%)";

hotbar.style.display =
    "flex";

hotbar.style.gap =
    "4px";

hotbar.style.background =
    "rgba(20,20,20,0.8)";

hotbar.style.padding =
    "6px";

hotbar.style.zIndex =
    "10";

document.body.appendChild(
    hotbar
);

const hotbarBlocks = [

    {
        number: "1",
        material: grassMaterial,
        color: "#55aa33"
    },

    {
        number: "2",
        material: dirtMaterial,
        color: "#8b5a2b"
    },

    {
        number: "3",
        material: stoneMaterial,
        color: "#777777"
    },

    {
        number: "4",
        material: woodMaterial,
        color: "#6b421f"
    },

    {
        number: "5",
        material: leavesMaterial,
        color: "#2f8f35"
    }

];

const hotbarSlots = [];

for (
    const item of hotbarBlocks
) {

    const slot =
        document.createElement("div");

    slot.style.width =
        "60px";

    slot.style.height =
        "60px";

    slot.style.background =
        "#333";

    slot.style.border =
        "3px solid #777";

    slot.style.position =
        "relative";

    slot.style.display =
        "flex";

    slot.style.alignItems =
        "center";

    slot.style.justifyContent =
        "center";

    const preview =
        document.createElement("div");

    preview.style.width =
        "38px";

    preview.style.height =
        "38px";

    preview.style.background =
        item.color;

    preview.style.border =
        "2px solid #111";

    slot.appendChild(
        preview
    );

    const number =
        document.createElement("div");

    number.innerText =
        item.number;

    number.style.position =
        "absolute";

    number.style.bottom =
        "2px";

    number.style.left =
        "4px";

    number.style.color =
        "white";

    number.style.fontWeight =
        "bold";

    slot.appendChild(
        number
    );

    slot.onclick = () => {

        selectedMaterial =
            item.material;

        updateHotbar();

    };

    hotbar.appendChild(
        slot
    );

    hotbarSlots.push(
        slot
    );

}

function updateHotbar() {

    hotbarSlots.forEach(
        (slot, index) => {

            if (
                hotbarBlocks[index]
                    .material ===
                selectedMaterial
            ) {

                slot.style.border =
                    "4px solid white";

                slot.style.boxShadow =
                    "0 0 10px white";

            } else {

                slot.style.border =
                    "3px solid #777";

                slot.style.boxShadow =
                    "none";

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

let highlightedBlock = null;
let highlightBox = null;

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

function updateHighlight() {

    const hit =
        getTargetBlock();

    if (!hit) {

        if (highlightBox) {

            scene.remove(
                highlightBox
            );

        }

        highlightedBlock =
            null;

        return;

    }

    const block =
        hit.object;

    if (
        highlightedBlock !== block
    ) {

        if (highlightBox) {

            scene.remove(
                highlightBox
            );

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

        scene.add(
            highlightBox
        );

        highlightedBlock =
            block;

    }

    highlightBox.position.copy(
        block.position
    );

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

    scene.remove(
        block
    );

    const index =
        blocks.indexOf(block);

    if (index !== -1) {

        blocks.splice(
            index,
            1
        );

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

    position.add(
        normal
    );

    position.x =
        Math.round(
            position.x
        );

    position.y =
        Math.round(
            position.y
        );

    position.z =
        Math.round(
            position.z
        );

    // Don't put block inside player
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

    // Don't duplicate blocks
    for (
        const existing of blocks
    ) {

        if (
            existing.position.distanceTo(
                position
            ) < 0.1
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
    event => {

        if (!mouseLocked) return;

        if (
            event.button === 0
        ) {

            breakBlock();

        }

        if (
            event.button === 2
        ) {

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
// GAME LOOP
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );

    const speed = 0.08;

    let dx = 0;
    let dz = 0;

    // Forward/back
    if (keys["KeyW"]) {
        dz -= speed;
    }

    if (keys["KeyS"]) {
        dz += speed;
    }

    // Left/right
    if (keys["KeyA"]) {
        dx -= speed;
    }

    if (keys["KeyD"]) {
        dx += speed;
    }

    // Rotate movement based on camera
    const sin =
        Math.sin(yaw);

    const cos =
        Math.cos(yaw);

    const moveX =
        dx * cos -
        dz * sin;

    const moveZ =
        dx * sin +
        dz * cos;

    movePlayer(
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
