```javascript
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ============================================================
// MINTCRAFT - OPTIMIZED VERSION
// ============================================================

const BLOCK_SIZE = 0.75;
const HALF_BLOCK = BLOCK_SIZE / 2;

// Smaller render workload
const MAX_PIXEL_RATIO = 1.5;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);

const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
);

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// ============================================================
// LIGHTING
// ============================================================

const sun = new THREE.DirectionalLight(
    0xffffff,
    1.8
);

sun.position.set(30, 50, 20);
scene.add(sun);

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.2
    )
);

// ============================================================
// TEXTURES
// ============================================================

const textureLoader = new THREE.TextureLoader();

function loadTexture(path) {

    const texture =
        textureLoader.load(path);

    texture.magFilter =
        THREE.NearestFilter;

    texture.minFilter =
        THREE.NearestFilter;

    texture.colorSpace =
        THREE.SRGBColorSpace;

    return texture;
}

const grassTopTexture =
    loadTexture("./textures/grass_top.png");

const grassSideTexture =
    loadTexture("./textures/grass_side.png");

const dirtTexture =
    loadTexture("./textures/dirt.png");

const stoneTexture =
    loadTexture("./textures/stone.png");

const woodSideTexture =
    loadTexture("./textures/wood_side.png");

const woodTopTexture =
    loadTexture("./textures/wood_top.png");

const leavesTexture =
    loadTexture("./textures/leaves.png");

// ============================================================
// MATERIALS
// ============================================================

function mat(texture, options = {}) {

    return new THREE.MeshLambertMaterial({
        map: texture,
        ...options
    });
}

const grassMaterial = [

    mat(grassSideTexture),
    mat(grassSideTexture),
    mat(grassTopTexture),
    mat(grassSideTexture),
    mat(grassSideTexture),
    mat(grassSideTexture)
];

const dirtMaterial = [

    mat(dirtTexture),
    mat(dirtTexture),
    mat(dirtTexture),
    mat(dirtTexture),
    mat(dirtTexture),
    mat(dirtTexture)
];

const stoneMaterial = [

    mat(stoneTexture),
    mat(stoneTexture),
    mat(stoneTexture),
    mat(stoneTexture),
    mat(stoneTexture),
    mat(stoneTexture)
];

const woodMaterial = [

    mat(woodSideTexture),
    mat(woodSideTexture),
    mat(woodTopTexture),
    mat(woodTopTexture),
    mat(woodSideTexture),
    mat(woodSideTexture)
];

const leavesMaterial = [

    mat(leavesTexture),
    mat(leavesTexture),
    mat(leavesTexture),
    mat(leavesTexture),
    mat(leavesTexture),
    mat(leavesTexture)
];

const BLOCK_TYPES = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves"
];

const BLOCK_MATERIALS = {

    grass: grassMaterial,
    dirt: dirtMaterial,
    stone: stoneMaterial,
    wood: woodMaterial,
    leaves: leavesMaterial
};

// ============================================================
// BLOCK STORAGE
// ============================================================

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

    const key =
        blockKey(x, y, z);

    if (blockMap.has(key)) {
        return;
    }

    blockMap.set(
        key,
        {
            x,
            y,
            z,
            type,
            category
        }
    );

    worldDirty = true;
}

function removeBlock(block) {

    if (!block) return;

    const key =
        blockKey(
            block.x,
            block.y,
            block.z
        );

    blockMap.delete(key);

    worldDirty = true;
}

// ============================================================
// WORLD RENDERING
// ============================================================

// Instanced meshes dramatically reduce draw calls.

const worldMeshes = {};
const instanceRecords = {};

const blockGeometry =
    new THREE.BoxGeometry(
        BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );

const dummy =
    new THREE.Object3D();

let worldDirty = true;

function rebuildWorld() {

    // Remove old meshes
    for (const type of BLOCK_TYPES) {

        if (worldMeshes[type]) {

            scene.remove(
                worldMeshes[type]
            );

            worldMeshes[type] = null;
        }

        instanceRecords[type] = [];
    }

    // Count blocks
    const counts = {

        grass: 0,
        dirt: 0,
        stone: 0,
        wood: 0,
        leaves: 0
    };

    for (const block of blockMap.values()) {

        if (counts[block.type] !== undefined) {
            counts[block.type]++;
        }
    }

    // Create instanced meshes
    for (const type of BLOCK_TYPES) {

        const count =
            counts[type];

        if (count === 0) {
            continue;
        }

        const mesh =
            new THREE.InstancedMesh(
                blockGeometry,
                BLOCK_MATERIALS[type],
                count
            );

        mesh.frustumCulled = true;

        let index = 0;

        for (const block of blockMap.values()) {

            if (block.type !== type) {
                continue;
            }

            dummy.position.set(
                block.x * BLOCK_SIZE,
                block.y * BLOCK_SIZE,
                block.z * BLOCK_SIZE
            );

            dummy.rotation.set(
                0,
                0,
                0
            );

            dummy.scale.set(
                1,
                1,
                1
            );

            dummy.updateMatrix();

            mesh.setMatrixAt(
                index,
                dummy.matrix
            );

            instanceRecords[type][index] =
                block;

            index++;
        }

        mesh.instanceMatrix.needsUpdate = true;

        mesh.computeBoundingSphere();

        scene.add(mesh);

        worldMeshes[type] = mesh;
    }

    worldDirty = false;
}

// ============================================================
// RANDOM WORLD SEED
// ============================================================

const seed =
    Math.floor(
        Math.random() * 1000000000
    );

console.log(
    "MintCraft World Seed:",
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

// Slightly smaller world while keeping it large
const WORLD_SIZE = 22;

function terrainHeight(x, z) {

    const hills =
        Math.sin(
            (x + seed * 0.00001) * 0.11
        ) * 2.5;

    const valleys =
        Math.cos(
            (z - seed * 0.00001) * 0.12
        ) * 2.5;

    const small =
        Math.sin(
            (x + z + seed * 0.00002) * 0.20
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
                trunk.category === "tree"
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
    }

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

// Build the world once
rebuildWorld();

// ============================================================
// PLAYER
// ============================================================

const PLAYER_WIDTH = 0.45;
const PLAYER_DEPTH = 0.45;
const PLAYER_HEIGHT = 1.35;
const EYE_HEIGHT = 1.20;

const spawnGround =
    terrainHeights.get("0,0");

camera.position.set(
    0,
    spawnGround * BLOCK_SIZE -
        HALF_BLOCK +
        EYE_HEIGHT +
        0.05,
    5 * BLOCK_SIZE
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
    event => {

        if (
            event.code === "KeyW"
        )
            keys.w = true;

        if (
            event.code === "KeyA"
        )
            keys.a = true;

        if (
            event.code === "KeyS"
        )
            keys.s = true;

        if (
            event.code === "KeyD"
        )
            keys.d = true;

        if (
            event.code === "Space"
        ) {

            keys.space = true;

            event.preventDefault();
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
    }
);

document.addEventListener(
    "keyup",
    event => {

        if (
            event.code === "KeyW"
        )
            keys.w = false;

        if (
            event.code === "KeyA"
        )
            keys.a = false;

        if (
            event.code === "KeyS"
        )
            keys.s = false;

        if (
            event.code === "KeyD"
        )
            keys.d = false;

        if (
            event.code === "Space"
        )
            keys.space = false;
    }
);

// ============================================================
// MOUSE LOOK
// ============================================================

let yaw = 0;
let pitch = 0;

renderer.domElement.addEventListener(
    "click",
    () => {

        renderer.domElement.requestPointerLock();
    }
);

document.addEventListener(
    "mousemove",
    event => {

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {
            return;
        }

        yaw -=
            event.movementX * 0.002;

        pitch -=
            event.movementY * 0.002;

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
    feetY,
    pz,
    block
) {

    const halfW =
        PLAYER_WIDTH / 2;

    const halfD =
        PLAYER_DEPTH / 2;

    const blockX =
        block.x * BLOCK_SIZE;

    const blockY =
        block.y * BLOCK_SIZE;

    const blockZ =
        block.z * BLOCK_SIZE;

    return (

        px + halfW >
        blockX - HALF_BLOCK &&

        px - halfW <
        blockX + HALF_BLOCK &&

        feetY + PLAYER_HEIGHT >
        blockY - HALF_BLOCK &&

        feetY <
        blockY + HALF_BLOCK &&

        pz + halfD >
        blockZ - HALF_BLOCK &&

        pz - halfD <
        blockZ + HALF_BLOCK
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
            BLOCK_SIZE / 2
        ) - 1;

    const maxX =
        Math.floor(
            x / BLOCK_SIZE +
            PLAYER_WIDTH /
            BLOCK_SIZE / 2
        ) + 1;

    const minY =
        Math.floor(
            feetY / BLOCK_SIZE
        ) - 2;

    const maxY =
        Math.floor(
            (feetY + PLAYER_HEIGHT) /
            BLOCK_SIZE
        ) + 2;

    const minZ =
        Math.floor(
            z / BLOCK_SIZE -
            PLAYER_DEPTH /
            BLOCK_SIZE / 2
        ) - 1;

    const maxZ =
        Math.floor(
            z / BLOCK_SIZE +
            PLAYER_DEPTH /
            BLOCK_SIZE / 2
        ) + 1;

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

                const block =
                    getBlock(
                        bx,
                        by,
                        bz
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
// MOVEMENT
// ============================================================

function movePlayer() {

    const speed = 0.075;

    let forward = 0;
    let right = 0;

    if (keys.w)
        forward += 1;

    if (keys.s)
        forward -= 1;

    if (keys.a)
        right -= 1;

    if (keys.d)
        right += 1;

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

    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );

    direction.y = 0;

    if (
        direction.lengthSq() > 0
    ) {

        direction.normalize();
    }

    const rightVector =
        new THREE.Vector3(
            -direction.z,
            0,
            direction.x
        );

    const dx =
        (
            direction.x *
            forward +

            rightVector.x *
            right
        ) * speed;

    const dz =
        (
            direction.z *
            forward +

            rightVector.z *
            right
        ) * speed;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    if (
        !playerCollides(
            camera.position.x + dx,
            feet,
            camera.position.z
        )
    ) {

        camera.position.x += dx;
    }

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
// GROUND CHECK
// ============================================================

function findGroundBelow() {

    const playerX =
        camera.position.x;

    const playerZ =
        camera.position.z;

    const feetY =
        camera.position.y -
        EYE_HEIGHT;

    const gx =
        Math.floor(
            playerX / BLOCK_SIZE
        );

    const gz =
        Math.floor(
            playerZ / BLOCK_SIZE
        );

    let highestTop =
        -Infinity;

    for (
        let x = gx - 1;
        x <= gx + 1;
        x++
    ) {

        for (
            let z = gz - 1;
            z <= gz + 1;
            z++
        ) {

            const blockX =
                x * BLOCK_SIZE;

            const blockZ =
                z * BLOCK_SIZE;

            const horizontalX =
                playerX +
                    PLAYER_WIDTH / 2 >
                    blockX - HALF_BLOCK &&

                playerX -
                    PLAYER_WIDTH / 2 <
                    blockX + HALF_BLOCK;

            const horizontalZ =
                playerZ +
                    PLAYER_DEPTH / 2 >
                    blockZ - HALF_BLOCK &&

                playerZ -
                    PLAYER_DEPTH / 2 <
                    blockZ + HALF_BLOCK;

            if (
                !horizontalX ||
                !horizontalZ
            ) {
                continue;
            }

            // Only check nearby vertical blocks
            const startY =
                Math.floor(
                    feetY / BLOCK_SIZE
                ) - 2;

            const endY =
                Math.floor(
                    feetY / BLOCK_SIZE
                ) + 1;

            for (
                let y = startY;
                y <= endY;
                y++
            ) {

                const block =
                    getBlock(
                        x,
                        y,
                        z
                    );

                if (!block) {
                    continue;
                }

                const top =
                    y * BLOCK_SIZE +
                    HALF_BLOCK;

                if (
                    top <= feetY + 0.10 &&
                    top > highestTop
                ) {

                    highestTop = top;
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

    const ground =
        findGroundBelow();

    if (
        keys.space &&
        grounded
    ) {

        velocityY =
            JUMP_POWER;

        grounded = false;

        keys.space = false;
    }

    velocityY -= GRAVITY;

    if (
        velocityY < -0.35
    ) {

        velocityY = -0.35;
    }

    const nextY =
        camera.position.y +
        velocityY;

    const nextFeet =
        nextY -
        EYE_HEIGHT;

    if (
        ground !== -Infinity &&
        nextFeet <= ground &&
        velocityY <= 0
    ) {

        camera.position.y =
            ground +
            EYE_HEIGHT;

        velocityY = 0;

        grounded = true;

    } else {

        camera.position.y =
            nextY;

        grounded = false;
    }
}

// ============================================================
// CROSSHAIR
// ============================================================

const crosshair =
    document.createElement("div");

crosshair.textContent = "+";

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
    "28px";

crosshair.style.fontWeight =
    "bold";

crosshair.style.fontFamily =
    "Arial";

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

hotbar.style.position =
    "fixed";

hotbar.style.left =
    "50%";

hotbar.style.bottom =
    "20px";

hotbar.style.transform =
    "translateX(-50%)";

hotbar.style.display =
    "flex";

hotbar.style.gap =
    "5px";

hotbar.style.padding =
    "7px";

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

const hotbarSlots = [];

let selectedType =
    "grass";

for (
    let i = 0;
    i < BLOCK_TYPES.length;
    i++
) {

    const type =
        BLOCK_TYPES[i];

    const slot =
        document.createElement("div");

    slot.style.width =
        "55px";

    slot.style.height =
        "55px";

    slot.style.background =
        "#444";

    slot.style.position =
        "relative";

    slot.style.boxSizing =
        "border-box";

    slot.style.cursor =
        "pointer";

    const preview =
        document.createElement("div");

    preview.style.width =
        "35px";

    preview.style.height =
        "35px";

    preview.style.position =
        "absolute";

    preview.style.left =
        "8px";

    preview.style.top =
        "8px";

    preview.style.background =
        "#777";

    slot.appendChild(
        preview
    );

    const number =
        document.createElement("div");

    number.textContent =
        String(i + 1);

    number.style.position =
        "absolute";

    number.style.left =
        "3px";

    number.style.bottom =
        "2px";

    number.style.color =
        "white";

    number.style.fontWeight =
        "bold";

    slot.appendChild(
        number
    );

    slot.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            selectedType =
                type;

            updateHotbar();
        }
    );

    hotbar.appendChild(
        slot
    );

    hotbarSlots.push(
        slot
    );
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
            BLOCK_TYPES[i] ===
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
// RAYCASTING
// ============================================================

const raycaster =
    new THREE.Raycaster();

raycaster.far = 6;

const center =
    new THREE.Vector2(
        0,
        0
    );

let currentHit = null;

function getTargetBlock() {

    raycaster.setFromCamera(
        center,
        camera
    );

    const meshes =
        [];

    for (
        const type of BLOCK_TYPES
    ) {

        if (
            worldMeshes[type]
        ) {

            meshes.push(
                worldMeshes[type]
            );
        }
    }

    if (
        meshes.length === 0
    ) {
        return null;
    }

    const hits =
        raycaster.intersectObjects(
            meshes,
            false
        );

    if (
        hits.length === 0
    ) {

        return null;
    }

    const hit =
        hits[0];

    const type =
        hit.object.userData.blockType;

    const block =
        instanceRecords[type]?.[
            hit.instanceId
        ];

    if (!block) {
        return null;
    }

    return {
        hit,
        block
    };
}

// ============================================================
// BLOCK HIGHLIGHT
// ============================================================

let highlight = null;

const highlightMaterial =
    new THREE.LineBasicMaterial({
        color: 0xffffff
    });

const highlightGeometry =
    new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
            BLOCK_SIZE + 0.03,
            BLOCK_SIZE + 0.03,
            BLOCK_SIZE + 0.03
        )
    );

function updateHighlight() {

    // Only raycast around 20 times per second
    // instead of every frame.

    if (
        frameCount % 3 !== 0
    ) {
        return;
    }

    const target =
        getTargetBlock();

    currentHit =
        target;

    if (!target) {

        if (highlight) {

            scene.remove(
                highlight
            );

            highlight = null;
        }

        return;
    }

    if (!highlight) {

        highlight =
            new THREE.LineSegments(
                highlightGeometry,
                highlightMaterial
            );

        scene.add(
            highlight
        );
    }

    highlight.position.set(
        target.block.x *
            BLOCK_SIZE,

        target.block.y *
            BLOCK_SIZE,

        target.block.z *
            BLOCK_SIZE
    );
}

// ============================================================
// BREAK BLOCK
// ============================================================

function breakBlock() {

    const target =
        getTargetBlock();

    if (!target) {
        return;
    }

    if (
        target.block.y <= -4
    ) {
        return;
    }

    removeBlock(
        target.block
    );
}

// ============================================================
// PLACE BLOCK
// ============================================================

function placeBlock() {

    const target =
        getTargetBlock();

    if (!target) {
        return;
    }

    const block =
        target.block;

    const normal =
        target.hit.face.normal;

    const nx =
        Math.round(
            normal.x
        );

    const ny =
        Math.round(
            normal.y
        );

    const nz =
        Math.round(
            normal.z
        );

    const newX =
        block.x + nx;

    const newY =
        block.y + ny;

    const newZ =
        block.z + nz;

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
    const blockX =
        newX * BLOCK_SIZE;

    const blockY =
        newY * BLOCK_SIZE;

    const blockZ =
        newZ * BLOCK_SIZE;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const overlap =

        camera.position.x +
            PLAYER_WIDTH / 2 >
            blockX - HALF_BLOCK &&

        camera.position.x -
            PLAYER_WIDTH / 2 <
            blockX + HALF_BLOCK &&

        feet + PLAYER_HEIGHT >
            blockY - HALF_BLOCK &&

        feet <
            blockY + HALF_BLOCK &&

        camera.position.z +
            PLAYER_DEPTH / 2 >
            blockZ - HALF_BLOCK &&

        camera.position.z -
            PLAYER_DEPTH / 2 <
            blockZ + HALF_BLOCK;

    if (overlap) {
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
    event => {

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
    event => {

        event.preventDefault();
    }
);

// ============================================================
// GAME LOOP
// ============================================================

let frameCount = 0;

function animate() {

    requestAnimationFrame(
        animate
    );

    frameCount++;

    // Rebuild only after a block is
    // added or removed.
    if (worldDirty) {

        rebuildWorld();

        // Restore block type on each mesh
        for (
            const type of BLOCK_TYPES
        ) {

            if (
                worldMeshes[type]
            ) {

                worldMeshes[type]
                    .userData.blockType =
                    type;
            }
        }
    }

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
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                MAX_PIXEL_RATIO
            )
        );
    }
);
```
