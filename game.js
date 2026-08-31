import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ============================================================
// MINTCRAFT
// ============================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.05,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// ============================================================
// WORLD SCALE
// ============================================================

const BLOCK_SIZE = 0.75;

const HALF_BLOCK = BLOCK_SIZE / 2;

// Player dimensions
const PLAYER_WIDTH = 0.45;
const PLAYER_DEPTH = 0.45;
const PLAYER_HEIGHT = 1.35;
const EYE_HEIGHT = 1.20;

// ============================================================
// LIGHTING
// ============================================================

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(30, 50, 20);
scene.add(sun);

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    1.5
);

scene.add(ambient);

// ============================================================
// BLOCK TYPES
// ============================================================

const BLOCKS = {

    grass: {
        material: new THREE.MeshLambertMaterial({
            color: 0x55aa33
        }),
        color: "#55aa33"
    },

    dirt: {
        material: new THREE.MeshLambertMaterial({
            color: 0x8b5a2b
        }),
        color: "#8b5a2b"
    },

    stone: {
        material: new THREE.MeshLambertMaterial({
            color: 0x777777
        }),
        color: "#777777"
    },

    wood: {
        material: new THREE.MeshLambertMaterial({
            color: 0x6b421f
        }),
        color: "#6b421f"
    },

    leaves: {
        material: new THREE.MeshLambertMaterial({
            color: 0x2f8f35,
            transparent: true,
            opacity: 0.9
        }),
        color: "#2f8f35"
    }
};

let selectedType = "grass";

// ============================================================
// BLOCK STORAGE
// ============================================================

const blocks = [];
const blockMap = new Map();

function blockKey(x, y, z) {
    return `${x},${y},${z}`;
}

function getBlock(x, y, z) {
    return blockMap.get(
        blockKey(
            Math.round(x),
            Math.round(y),
            Math.round(z)
        )
    );
}

function worldX(x) {
    return x * BLOCK_SIZE;
}

function worldY(y) {
    return y * BLOCK_SIZE;
}

function worldZ(z) {
    return z * BLOCK_SIZE;
}

function addBlock(
    x,
    y,
    z,
    type,
    category = "placed"
) {

    x = Math.round(x);
    y = Math.round(y);
    z = Math.round(z);

    if (getBlock(x, y, z)) {
        return null;
    }

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
        ),
        BLOCKS[type].material
    );

    mesh.position.set(
        worldX(x),
        worldY(y),
        worldZ(z)
    );

    mesh.userData.x = x;
    mesh.userData.y = y;
    mesh.userData.z = z;

    mesh.userData.type = type;
    mesh.userData.category = category;

    scene.add(mesh);
    blocks.push(mesh);

    blockMap.set(
        blockKey(x, y, z),
        mesh
    );

    return mesh;
}

function removeBlock(block) {

    if (!block) return;

    scene.remove(block);

    const index =
        blocks.indexOf(block);

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
}

// ============================================================
// RANDOM WORLD SEED
// ============================================================

const seed =
    Math.floor(
        Math.random() * 1000000000
    );

console.log(
    "MintCraft Seed:",
    seed
);

function random2D(x, z) {

    const value =
        Math.sin(
            x * 127.1 +
            z * 311.7 +
            seed
        ) * 43758.5453123;

    return (
        value -
        Math.floor(value)
    );
}

// ============================================================
// TERRAIN
// ============================================================

const terrainHeights =
    new Map();

function terrainHeight(x, z) {

    const hills =
        Math.sin(
            (x + seed * 0.00001) *
            0.11
        ) * 2.5;

    const valleys =
        Math.cos(
            (z - seed * 0.00001) *
            0.12
        ) * 2.5;

    const small =
        Math.sin(
            (x + z + seed * 0.00002) *
            0.20
        ) * 1.2;

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(
                5 +
                hills +
                valleys +
                small
            )
        )
    );
}

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
            terrainHeight(x, z);

        terrainHeights.set(
            `${x},${z}`,
            height
        );

        for (
            let y = -4;
            y < height;
            y++
        ) {

            let type;

            if (
                y === height - 1
            ) {
                type = "grass";

            } else if (
                y >= height - 4
            ) {
                type = "dirt";

            } else {
                type = "stone";
            }

            addBlock(
                x,
                y,
                z,
                type,
                "terrain"
            );
        }
    }
}

// ============================================================
// TREES
// ============================================================

function hasTreeNearby(x, z) {

    for (
        let dx = -3;
        dx <= 3;
        dx++
    ) {

        for (
            let dz = -3;
            dz <= 3;
            dz++
        ) {

            const ground =
                terrainHeights.get(
                    `${x + dx},${z + dz}`
                );

            if (
                ground === undefined
            ) {
                continue;
            }

            const trunk =
                getBlock(
                    x + dx,
                    ground,
                    z + dz
                );

            if (
                trunk &&
                trunk.userData.category ===
                "tree"
            ) {
                return true;
            }
        }
    }

    return false;
}

function createTree(
    x,
    ground,
    z
) {

    // Trunk
    for (
        let y = 0;
        y < 4;
        y++
    ) {

        addBlock(
            x,
            ground + y,
            z,
            "wood",
            "tree"
        );
    }

    // Lower leaves
    for (
        let dx = -2;
        dx <= 2;
        dx++
    ) {

        for (
            let dz = -2;
            dz <= 2;
            dz++
        ) {

            if (
                Math.abs(dx) +
                Math.abs(dz) <= 3 &&
                !(dx === 0 && dz === 0)
            ) {

                addBlock(
                    x + dx,
                    ground + 3,
                    z + dz,
                    "leaves",
                    "tree"
                );
            }
        }
    }

    // Upper leaves
    for (
        let dx = -1;
        dx <= 1;
        dx++
    ) {

        for (
            let dz = -1;
        dz <= 1;
        dz++
    ) {

        if (
            !(dx === 0 && dz === 0)
        ) {

            addBlock(
                x + dx,
                ground + 4,
                z + dz,
                "leaves",
                "tree"
            );
        }
    }

    // Top
    addBlock(
        x,
        ground + 5,
        z,
        "leaves",
        "tree"
    );
}

for (
    let x = -WORLD_SIZE + 4;
    x <= WORLD_SIZE - 4;
    x++
) {

    for (
        let z = -WORLD_SIZE + 4;
        z <= WORLD_SIZE - 4;
        z++
    ) {

        if (
            Math.abs(x) < 5 &&
            Math.abs(z) < 5
        ) {
            continue;
        }

        const ground =
            terrainHeights.get(
                `${x},${z}`
            );

        if (
            ground === undefined
        ) {
            continue;
        }

        if (
            random2D(x, z) > 0.975 &&
            !hasTreeNearby(x, z)
        ) {

            createTree(
                x,
                ground,
                z
            );
        }
    }
}

// ============================================================
// PLAYER
// ============================================================

camera.position.set(
    0,
    worldY(
        terrainHeight(0, 5)
    ) +
    HALF_BLOCK +
    EYE_HEIGHT +
    0.02,
    worldZ(5)
);

let velocityY = 0;

const GRAVITY = 0.012;
const JUMP_POWER = 0.24;

let grounded = false;

// ============================================================
// KEYBOARD
// ============================================================

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code === "KeyW"
        ) {
            keys.w = true;
        }

        if (
            event.code === "KeyA"
        ) {
            keys.a = true;
        }

        if (
            event.code === "KeyS"
        ) {
            keys.s = true;
        }

        if (
            event.code === "KeyD"
        ) {
            keys.d = true;
        }

        if (
            event.code === "Space"
        ) {
            keys.space = true;
        }

        if (
            event.code === "Digit1"
        ) {
            selectedType = "grass";
            updateHotbar();
        }

        if (
            event.code === "Digit2"
        ) {
            selectedType = "dirt";
            updateHotbar();
        }

        if (
            event.code === "Digit3"
        ) {
            selectedType = "stone";
            updateHotbar();
        }

        if (
            event.code === "Digit4"
        ) {
            selectedType = "wood";
            updateHotbar();
        }

        if (
            event.code === "Digit5"
        ) {
            selectedType = "leaves";
            updateHotbar();
        }

        if (
            event.code === "Space"
        ) {
            event.preventDefault();
        }
    }
);

document.addEventListener(
    "keyup",
    function(event) {

        if (
            event.code === "KeyW"
        ) {
            keys.w = false;
        }

        if (
            event.code === "KeyA"
        ) {
            keys.a = false;
        }

        if (
            event.code === "KeyS"
        ) {
            keys.s = false;
        }

        if (
            event.code === "KeyD"
        ) {
            keys.d = false;
        }

        if (
            event.code === "Space"
        ) {
            keys.space = false;
        }
    }
);

// ============================================================
// MOUSE LOOK
// ============================================================

let yaw = 0;
let pitch = 0;

renderer.domElement.addEventListener(
    "click",
    function() {

        renderer.domElement.requestPointerLock();
    }
);

document.addEventListener(
    "mousemove",
    function(event) {

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {
            return;
        }

        yaw -=
            event.movementX *
            0.002;

        pitch -=
            event.movementY *
            0.002;

        pitch =
            Math.max(
                -Math.PI / 2 + 0.05,
                Math.min(
                    Math.PI / 2 - 0.05,
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

// ============================================================
// COLLISION
// ============================================================

function playerIntersectsBlock(
    px,
    py,
    pz,
    block
) {

    const halfW =
        PLAYER_WIDTH / 2;

    const halfD =
        PLAYER_DEPTH / 2;

    const playerMinX =
        px - halfW;

    const playerMaxX =
        px + halfW;

    const playerMinY =
        py;

    const playerMaxY =
        py + PLAYER_HEIGHT;

    const playerMinZ =
        pz - halfD;

    const playerMaxZ =
        pz + halfD;

    const blockCenterX =
        worldX(block.userData.x);

    const blockCenterY =
        worldY(block.userData.y);

    const blockCenterZ =
        worldZ(block.userData.z);

    const blockMinX =
        blockCenterX - HALF_BLOCK;

    const blockMaxX =
        blockCenterX + HALF_BLOCK;

    const blockMinY =
        blockCenterY - HALF_BLOCK;

    const blockMaxY =
        blockCenterY + HALF_BLOCK;

    const blockMinZ =
        blockCenterZ - HALF_BLOCK;

    const blockMaxZ =
        blockCenterZ + HALF_BLOCK;

    return (
        playerMaxX > blockMinX &&
        playerMinX < blockMaxX &&
        playerMaxY > blockMinY &&
        playerMinY < blockMaxY &&
        playerMaxZ > blockMinZ &&
        playerMinZ < blockMaxZ
    );
}

function playerCollides(
    x,
    feetY,
    z
) {

    const minX =
        Math.floor(
            x / BLOCK_SIZE -
            PLAYER_WIDTH /
            BLOCK_SIZE /
            2
        ) - 1;

    const maxX =
        Math.floor(
            x / BLOCK_SIZE +
            PLAYER_WIDTH /
            BLOCK_SIZE /
            2
        ) + 1;

    const minY =
        Math.floor(
            feetY / BLOCK_SIZE
        ) - 1;

    const maxY =
        Math.floor(
            (feetY + PLAYER_HEIGHT) /
            BLOCK_SIZE
        ) + 1;

    const minZ =
        Math.floor(
            z / BLOCK_SIZE -
            PLAYER_DEPTH /
            BLOCK_SIZE /
            2
        ) - 1;

    const maxZ =
        Math.floor(
            z / BLOCK_SIZE +
            PLAYER_DEPTH /
            BLOCK_SIZE /
            2
        ) + 1;

    for (
        let x1 = minX;
        x1 <= maxX;
        x1++
    ) {

        for (
            let y1 = minY;
            y1 <= maxY;
            y1++
        ) {

            for (
                let z1 = minZ;
                z1 <= maxZ;
                z1++
            ) {

                const block =
                    getBlock(
                        x1,
                        y1,
                        z1
                    );

                if (
                    block &&
                    playerIntersectsBlock(
                        x,
                        feetY,
                        z,
                        block
                    )
                ) {

                    return true;
                }
            }
        }
    }

    return false;
}

// ============================================================
// WASD MOVEMENT
// ============================================================

function movePlayer() {

    const speed = 0.075;

    let forward = 0;
    let right = 0;

    if (keys.w) forward += 1;
    if (keys.s) forward -= 1;
    if (keys.a) right -= 1;
    if (keys.d) right += 1;

    if (
        forward === 0 &&
        right === 0
    ) {
        return;
    }

    const length =
        Math.hypot(
            forward,
            right
        );

    forward /= length;
    right /= length;

    const forwardVector =
        new THREE.Vector3();

    camera.getWorldDirection(
        forwardVector
    );

    forwardVector.y = 0;

    if (
        forwardVector.lengthSq() > 0
    ) {
        forwardVector.normalize();
    }

    const rightVector =
        new THREE.Vector3(
            -forwardVector.z,
            0,
            forwardVector.x
        );

    const dx =
        (
            forwardVector.x *
            forward +
            rightVector.x *
            right
        ) * speed;

    const dz =
        (
            forwardVector.z *
            forward +
            rightVector.z *
            right
        ) * speed;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    // X
    if (
        !playerCollides(
            camera.position.x + dx,
            feet,
            camera.position.z
        )
    ) {

        camera.position.x += dx;
    }

    // Z
    if (
        !playerCollides(
            camera.position.x,
            feet,
            camera.position.z + dz
        )
    ) {

        camera.position.z += dz;
    }
}

// ============================================================
// FIND ACTUAL BLOCK UNDER PLAYER
// ============================================================

function findGroundBelow() {

    const px =
        camera.position.x;

    const pz =
        camera.position.z;

    const minX =
        Math.floor(
            px / BLOCK_SIZE -
            PLAYER_WIDTH /
            BLOCK_SIZE /
            2
        );

    const maxX =
        Math.floor(
            px / BLOCK_SIZE +
            PLAYER_WIDTH /
            BLOCK_SIZE /
            2
        );

    const minZ =
        Math.floor(
            pz / BLOCK_SIZE -
            PLAYER_DEPTH /
            BLOCK_SIZE /
            2
        );

    const maxZ =
        Math.floor(
            pz / BLOCK_SIZE +
            PLAYER_DEPTH /
            BLOCK_SIZE /
            2
        );

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const currentBlockY =
        Math.floor(
            feet / BLOCK_SIZE
        );

    let highestTop =
        -Infinity;

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
                let by =
                    currentBlockY - 3;
                by <= currentBlockY + 1;
                by++
            ) {

                const block =
                    getBlock(
                        bx,
                        by,
                        bz
                    );

                if (!block) continue;

                const blockTop =
                    worldY(by) +
                    HALF_BLOCK;

                const blockCenterX =
                    worldX(bx);

                const blockCenterZ =
                    worldZ(bz);

                const horizontalOverlap =
                    px +
                    PLAYER_WIDTH / 2 >
                    blockCenterX -
                    HALF_BLOCK &&

                    px -
                    PLAYER_WIDTH / 2 <
                    blockCenterX +
                    HALF_BLOCK &&

                    pz +
                    PLAYER_DEPTH / 2 >
                    blockCenterZ -
                    HALF_BLOCK &&

                    pz -
                    PLAYER_DEPTH / 2 <
                    blockCenterZ +
                    HALF_BLOCK;

                if (
                    horizontalOverlap &&
                    blockTop <=
                    feet + 0.12 &&
                    blockTop >
                    highestTop
                ) {

                    highestTop =
                        blockTop;
                }
            }
        }
    }

    return highestTop;
}

// ============================================================
// GRAVITY + JUMP
// ============================================================

function updatePhysics() {

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const ground =
        findGroundBelow();

    // Jump
    if (
        keys.space &&
        grounded
    ) {

        velocityY =
            JUMP_POWER;

        grounded = false;
        keys.space = false;
    }

    // Gravity
    velocityY -= GRAVITY;

    const newY =
        camera.position.y +
        velocityY;

    const newFeet =
        newY -
        EYE_HEIGHT;

    // Landing
    if (
        velocityY <= 0 &&
        ground !== -Infinity &&
        newFeet <= ground
    ) {

        camera.position.y =
            ground +
            EYE_HEIGHT;

        velocityY = 0;
        grounded = true;

    } else {

        camera.position.y =
            newY;

        grounded = false;
    }
}

// ============================================================
// CROSSHAIR
// ============================================================

const crosshair =
    document.createElement("div");

crosshair.textContent = "+";

crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";

crosshair.style.transform =
    "translate(-50%, -50%)";

crosshair.style.color = "white";
crosshair.style.fontSize = "28px";
crosshair.style.fontWeight = "bold";
crosshair.style.fontFamily = "Arial";

crosshair.style.textShadow =
    "2px 2px 2px black";

crosshair.style.pointerEvents =
    "none";

crosshair.style.zIndex =
    "9999";

document.body.appendChild(
    crosshair
);

// ============================================================
// HOTBAR
// ============================================================

const hotbar =
    document.createElement("div");

hotbar.style.position = "fixed";
hotbar.style.left = "50%";
hotbar.style.bottom = "20px";

hotbar.style.transform =
    "translateX(-50%)";

hotbar.style.display = "flex";
hotbar.style.gap = "5px";
hotbar.style.padding = "7px";

hotbar.style.background =
    "rgba(20,20,20,0.85)";

hotbar.style.border =
    "3px solid #777";

hotbar.style.borderRadius =
    "5px";

hotbar.style.zIndex =
    "9999";

document.body.appendChild(
    hotbar
);

const hotbarTypes = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves"
];

const hotbarSlots = [];

for (
    let i = 0;
    i < hotbarTypes.length;
    i++
) {

    const type =
        hotbarTypes[i];

    const slot =
        document.createElement("div");

    slot.style.width = "55px";
    slot.style.height = "55px";

    slot.style.background = "#444";
    slot.style.position = "relative";
    slot.style.boxSizing = "border-box";

    const preview =
        document.createElement("div");

    preview.style.width = "35px";
    preview.style.height = "35px";

    preview.style.position =
        "absolute";

    preview.style.left = "8px";
    preview.style.top = "8px";

    preview.style.background =
        BLOCKS[type].color;

    preview.style.border =
        "2px solid #111";

    slot.appendChild(preview);

    const number =
        document.createElement("div");

    number.textContent =
        String(i + 1);

    number.style.position =
        "absolute";

    number.style.left = "3px";
    number.style.bottom = "2px";

    number.style.color = "white";
    number.style.fontWeight = "bold";

    slot.appendChild(number);

    slot.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            selectedType = type;

            updateHotbar();
        }
    );

    hotbar.appendChild(slot);
    hotbarSlots.push(slot);
}

function updateHotbar() {

    for (
        let i = 0;
        i < hotbarSlots.length;
        i++
    ) {

        const slot =
            hotbarSlots[i];

        if (
            hotbarTypes[i] ===
            selectedType
        ) {

            slot.style.border =
                "4px solid white";

            slot.style.boxShadow =
                "0 0 8px white";

        } else {

            slot.style.border =
                "3px solid #777";

            slot.style.boxShadow =
                "none";
        }
    }
}

updateHotbar();

// ============================================================
// RAYCASTER
// ============================================================

const raycaster =
    new THREE.Raycaster();

raycaster.far = 6;

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

    return hits[0];
}

// ============================================================
// HIGHLIGHT
// ============================================================

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

        const edges =
            new THREE.EdgesGeometry(
                new THREE.BoxGeometry(
                    BLOCK_SIZE + 0.025,
                    BLOCK_SIZE + 0.025,
                    BLOCK_SIZE + 0.025
                )
            );

        highlight =
            new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({
                    color: 0xffffff
                })
            );

        scene.add(highlight);
    }

    highlight.position.copy(
        hit.object.position
    );
}

// ============================================================
// BREAK BLOCK
// ============================================================

function breakBlock() {

    const hit =
        getTargetBlock();

    if (!hit) return;

    if (
        hit.object.userData.y <= -4
    ) {
        return;
    }

    removeBlock(
        hit.object
    );
}

// ============================================================
// PLACE BLOCK
// ============================================================

function placeBlock() {

    const hit =
        getTargetBlock();

    if (!hit) return;

    const x =
        hit.object.userData.x;

    const y =
        hit.object.userData.y;

    const z =
        hit.object.userData.z;

    const nx =
        Math.round(
            hit.face.normal.x
        );

    const ny =
        Math.round(
            hit.face.normal.y
        );

    const nz =
        Math.round(
            hit.face.normal.z
        );

    const newX =
        x + nx;

    const newY =
        y + ny;

    const newZ =
        z + nz;

    if (
        getBlock(
            newX,
            newY,
            newZ
        )
    ) {
        return;
    }

    // Don't place inside player
    const newCenterX =
        worldX(newX);

    const newCenterY =
        worldY(newY);

    const newCenterZ =
        worldZ(newZ);

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const playerMinX =
        camera.position.x -
        PLAYER_WIDTH / 2;

    const playerMaxX =
        camera.position.x +
        PLAYER_WIDTH / 2;

    const playerMinY =
        feet;

    const playerMaxY =
        feet +
        PLAYER_HEIGHT;

    const playerMinZ =
        camera.position.z -
        PLAYER_DEPTH / 2;

    const playerMaxZ =
        camera.position.z +
        PLAYER_DEPTH / 2;

    const blockMinX =
        newCenterX -
        HALF_BLOCK;

    const blockMaxX =
        newCenterX +
        HALF_BLOCK;

    const blockMinY =
        newCenterY -
        HALF_BLOCK;

    const blockMaxY =
        newCenterY +
        HALF_BLOCK;

    const blockMinZ =
        newCenterZ -
        HALF_BLOCK;

    const blockMaxZ =
        newCenterZ +
        HALF_BLOCK;

    const overlaps =
        playerMaxX > blockMinX &&
        playerMinX < blockMaxX &&
        playerMaxY > blockMinY &&
        playerMinY < blockMaxY &&
        playerMaxZ > blockMinZ &&
        playerMinZ < blockMaxZ;

    if (overlaps) {
        return;
    }

    addBlock(
        newX,
        newY,
        newZ,
        selectedType,
        "placed"
    );
}

// ============================================================
// MOUSE BUTTONS
// ============================================================

renderer.domElement.addEventListener(
    "mousedown",
    function(event) {

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {
            return;
        }

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
    function(event) {
        event.preventDefault();
    }
);

// ============================================================
// GAME LOOP
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );

    movePlayer();

    updatePhysics();

    updateHighlight();

    renderer.render(
        scene,
        camera
    );
}

animate();

// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    function() {

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
