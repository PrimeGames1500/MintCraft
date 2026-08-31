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
// LIGHTING
// =====================================================

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(30, 40, 20);
scene.add(sun);

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    1.5
);

scene.add(ambient);

// =====================================================
// MATERIALS
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
// BLOCK DATA
// =====================================================

const blocks = [];
const blockMap = new Map();

function blockKey(x, y, z) {
    return `${x},${y},${z}`;
}

function createBlock(x, y, z, material) {

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const block = new THREE.Mesh(
        geometry,
        material
    );

    block.position.set(x, y, z);

    block.userData.x = x;
    block.userData.y = y;
    block.userData.z = z;

    scene.add(block);
    blocks.push(block);

    blockMap.set(
        blockKey(x, y, z),
        block
    );

    return block;
}

function getBlock(x, y, z) {

    return blockMap.get(
        blockKey(
            Math.floor(x),
            Math.floor(y),
            Math.floor(z)
        )
    );
}

function removeBlock(block) {

    scene.remove(block);

    const index = blocks.indexOf(block);

    if (index !== -1) {
        blocks.splice(index, 1);
    }

    blockMap.delete(
        blockKey(
            block.userData.x,
            block.userData.y,
            block.userData.z
        )
    );

    block.geometry.dispose();
}

// =====================================================
// RANDOM WORLD SEED
// =====================================================

const seed =
    Math.floor(Math.random() * 1000000000);

console.log("MintCraft Seed:", seed);

// =====================================================
// TERRAIN
// =====================================================

function getHeight(x, z) {

    const a =
        Math.sin(
            (x + seed * 0.00001) * 0.12
        ) * 3;

    const b =
        Math.cos(
            (z - seed * 0.00001) * 0.11
        ) * 3;

    const c =
        Math.sin(
            (x + z + seed * 0.00002) * 0.18
        ) * 1.5;

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(5 + a + b + c)
        )
    );
}

function seededRandom(x, z) {

    const value =
        Math.sin(
            x * 127.1 +
            z * 311.7 +
            seed
        ) * 43758.5453;

    return value - Math.floor(value);
}

// =====================================================
// TREES
// =====================================================

function createTree(x, groundHeight, z) {

    // Trunk
    for (let y = 0; y < 4; y++) {

        createBlock(
            x,
            groundHeight + y,
            z,
            woodMaterial
        );

    }

    // Leaves
    for (let x2 = -2; x2 <= 2; x2++) {

        for (let z2 = -2; z2 <= 2; z2++) {

            for (let y2 = 2; y2 <= 4; y2++) {

                if (
                    Math.abs(x2) +
                    Math.abs(z2) <= 3
                ) {

                    createBlock(
                        x + x2,
                        groundHeight + y2,
                        z + z2,
                        leavesMaterial
                    );

                }

            }

        }

    }

    createBlock(
        x,
        groundHeight + 5,
        z,
        leavesMaterial
    );
}

// =====================================================
// GENERATE WORLD
// =====================================================

const WORLD_SIZE = 25;

for (let x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {

    for (let z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {

        const height =
            getHeight(x, z);

        for (let y = -4; y < height; y++) {

            let material;

            if (y === height - 1) {

                material = grassMaterial;

            } else if (y >= height - 4) {

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
            seededRandom(x, z) > 0.97 &&
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

const PLAYER_WIDTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const PLAYER_DEPTH = 0.6;

const EYE_HEIGHT = 1.62;

camera.position.set(
    0,
    getHeight(0, 5) + EYE_HEIGHT,
    5
);

// =====================================================
// PLAYER PHYSICS
// =====================================================

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

        // Prevent browser scrolling with space
        if (
            event.code === "Space" ||
            event.code === "ArrowUp" ||
            event.code === "ArrowDown"
        ) {
            event.preventDefault();
        }

        if (event.code === "Digit1") {

            selectedMaterial =
                grassMaterial;

            updateHotbar();

        }

        if (event.code === "Digit2") {

            selectedMaterial =
                dirtMaterial;

            updateHotbar();

        }

        if (event.code === "Digit3") {

            selectedMaterial =
                stoneMaterial;

            updateHotbar();

        }

        if (event.code === "Digit4") {

            selectedMaterial =
                woodMaterial;

            updateHotbar();

        }

        if (event.code === "Digit5") {

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
            -Math.PI / 2 + 0.01,
            Math.min(
                Math.PI / 2 - 0.01,
                pitch
            )
        );

        camera.rotation.order = "YXZ";

        camera.rotation.y = yaw;
        camera.rotation.x = pitch;

    }
);

// =====================================================
// PLAYER COLLISION
// =====================================================

function playerTouchesBlock(
    x,
    y,
    z
) {

    const halfWidth =
        PLAYER_WIDTH / 2;

    const halfDepth =
        PLAYER_DEPTH / 2;

    const minX =
        Math.floor(
            x - halfWidth
        );

    const maxX =
        Math.floor(
            x + halfWidth
        );

    const minY =
        Math.floor(
            y
        );

    const maxY =
        Math.floor(
            y + PLAYER_HEIGHT
        );

    const minZ =
        Math.floor(
            z - halfDepth
        );

    const maxZ =
        Math.floor(
            z + halfDepth
        );

    for (
        let bx = minX;
        bx <= maxX;
        bx++
    ) {

        for (
            let by = minY;
            by <= maxY;
            by++
        ) {

            for (
                let bz = minZ;
                bz <= maxZ;
                bz++
            ) {

                if (
                    getBlock(
                        bx,
                        by,
                        bz
                    )
                ) {

                    return true;

                }
            }
        }
    }

    return false;
}

// =====================================================
// FIND GROUND
// =====================================================

function findGround(x, z) {

    const halfWidth =
        PLAYER_WIDTH / 2;

    const halfDepth =
        PLAYER_DEPTH / 2;

    const minX =
        Math.floor(
            x - halfWidth
        );

    const maxX =
        Math.floor(
            x + halfWidth
        );

    const minZ =
        Math.floor(
            z - halfDepth
        );

    const maxZ =
        Math.floor(
            z + halfDepth
        );

    let highest =
        -100;

    for (
        let bx = minX;
        bx <= maxX;
        bx++
    ) {

        for (
            let bz = minZ;
            bz <= maxZ;
            bz++
        ) {

            for (
                let by = 15;
                by >= -5;
                by--
            ) {

                if (
                    getBlock(
                        bx,
                        by,
                        bz
                    )
                ) {

                    highest =
                        Math.max(
                            highest,
                            by + 0.5
                        );

                    break;
                }
            }
        }
    }

    return highest;
}

// =====================================================
// MOVEMENT
// =====================================================

function movePlayer(dx, dz) {

    // Move X
    const newX =
        camera.position.x + dx;

    const feet =
        camera.position.y - EYE_HEIGHT;

    if (
        !playerTouchesBlock(
            newX,
            feet,
            camera.position.z
        )
    ) {

        camera.position.x =
            newX;

    }

    // Move Z
    const newZ =
        camera.position.z + dz;

    if (
        !playerTouchesBlock(
            camera.position.x,
            feet,
            newZ
        )
    ) {

        camera.position.z =
            newZ;

    }
}

// =====================================================
// PHYSICS
// =====================================================

function updatePhysics() {

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const ground =
        findGround(
            camera.position.x,
            camera.position.z
        );

    // Gravity
    if (
        feet > ground + 0.02
    ) {

        velocityY -= gravity;

        camera.position.y +=
            velocityY;

        grounded = false;

    }

    // Landing
    if (
        feet <= ground &&
        velocityY <= 0
    ) {

        camera.position.y =
            ground + EYE_HEIGHT;

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

        keys["Space"] = false;
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
    "100";

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

hotbar.style.padding =
    "6px";

hotbar.style.background =
    "rgba(20,20,20,0.8)";

hotbar.style.zIndex =
    "100";

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

for (
    const item of hotbarData
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
        item.key;

    number.style.position =
        "absolute";

    number.style.left =
        "4px";

    number.style.bottom =
        "2px";

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
                hotbarData[index]
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

// =====================================================
// BLOCK HIGHLIGHT
// =====================================================

let highlight = null;

function updateHighlight() {

    const hit =
        getTargetBlock();

    if (!hit) {

        if (highlight) {

            scene.remove(
                highlight
            );

            highlight = null;

        }

        return;
    }

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
        hit.object.position
    );
}

// =====================================================
// BREAK BLOCK
// =====================================================

function breakBlock() {

    const hit =
        getTargetBlock();

    if (!hit) return;

    removeBlock(
        hit.object
    );
}

// =====================================================
// PLACE BLOCK
// =====================================================

function placeBlock() {

    const hit =
        getTargetBlock();

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

    // Don't place where the player is
    const playerFeet =
        camera.position.y -
        EYE_HEIGHT;

    if (
        position.x + 0.5 >
            camera.position.x -
            PLAYER_WIDTH / 2 &&

        position.x - 0.5 <
            camera.position.x +
            PLAYER_WIDTH / 2 &&

        position.z + 0.5 >
            camera.position.z -
            PLAYER_DEPTH / 2 &&

        position.z - 0.5 <
            camera.position.z +
            PLAYER_DEPTH / 2 &&

        position.y + 0.5 >
            playerFeet &&

        position.y - 0.5 <
            camera.position.y
    ) {

        return;

    }

    if (
        getBlock(
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

    const speed =
        keys["ShiftLeft"] ||
        keys["ShiftRight"]
            ? 0.13
            : 0.08;

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

    // Normalize diagonal movement
    const length =
        Math.sqrt(
            forward * forward +
            right * right
        );

    if (length > speed) {

        forward =
            forward / length * speed;

        right =
            right / length * speed;

    }

    // Camera-relative movement
    const moveX =
        Math.sin(yaw) * forward +
        Math.cos(yaw) * right;

    const moveZ =
        Math.cos(yaw) * forward -
        Math.sin(yaw) * right;

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
