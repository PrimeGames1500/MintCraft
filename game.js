```javascript
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

/* =========================================================
   MINTCRAFT
   Optimized + textures + 8 blocks + inventory + collision
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);


/* =========================================================
   LIGHTING
   ========================================================= */

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(30, 60, 20);
scene.add(sun);

scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.5));


/* =========================================================
   TEXTURES
   ========================================================= */

const textureLoader = new THREE.TextureLoader();

function loadTexture(name) {
    const texture = textureLoader.load(
        "textures/" + name,
        undefined,
        undefined,
        function () {
            console.warn("Could not load texture:", name);
        }
    );

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

const textures = {
    grassTop: loadTexture("grass_top.png"),
    grassSide: loadTexture("grass_side.png"),
    dirt: loadTexture("dirt.png"),
    stone: loadTexture("stone.png"),
    woodSide: loadTexture("wood_side.png"),
    woodTop: loadTexture("wood_top.png"),
    leaves: loadTexture("leaves.png"),
    planks: loadTexture("planks.png"),
    glass: loadTexture("glass.png"),
    bricks: loadTexture("bricks.png")
};


/* =========================================================
   MATERIALS
   ========================================================= */

function normalMaterial(texture) {
    return new THREE.MeshLambertMaterial({
        map: texture
    });
}

const grassSideMaterial = normalMaterial(textures.grassSide);
const grassTopMaterial = normalMaterial(textures.grassTop);
const dirtMaterial = normalMaterial(textures.dirt);
const stoneMaterial = normalMaterial(textures.stone);
const woodSideMaterial = normalMaterial(textures.woodSide);
const woodTopMaterial = normalMaterial(textures.woodTop);

const leavesMaterial = new THREE.MeshLambertMaterial({
    map: textures.leaves,
    transparent: true,
    opacity: 0.9,
    alphaTest: 0.05
});

const planksMaterial = normalMaterial(textures.planks);

const glassMaterial = new THREE.MeshLambertMaterial({
    map: textures.glass,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
});

const bricksMaterial = normalMaterial(textures.bricks);


/* =========================================================
   BLOCKS
   ========================================================= */

const BLOCK_TYPES = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves",
    "planks",
    "glass",
    "bricks"
];

const grassMaterials = [
    grassSideMaterial,
    grassSideMaterial,
    grassTopMaterial,
    dirtMaterial,
    grassSideMaterial,
    grassSideMaterial
];

const woodMaterials = [
    woodSideMaterial,
    woodSideMaterial,
    woodTopMaterial,
    woodTopMaterial,
    woodSideMaterial,
    woodSideMaterial
];

const BLOCK_INFO = {
    grass: {
        material: grassMaterials,
        color: "#55aa33"
    },

    dirt: {
        material: dirtMaterial,
        color: "#8b5a2b"
    },

    stone: {
        material: stoneMaterial,
        color: "#777777"
    },

    wood: {
        material: woodMaterials,
        color: "#8a5a2b"
    },

    leaves: {
        material: leavesMaterial,
        color: "#2f8f35"
    },

    planks: {
        material: planksMaterial,
        color: "#c08a4b"
    },

    glass: {
        material: glassMaterial,
        color: "#b9e8ff"
    },

    bricks: {
        material: bricksMaterial,
        color: "#9b4d3a"
    }
};


/* =========================================================
   WORLD DATA
   ========================================================= */

const blocks = new Map();
const terrain = new Map();

function key(x, y, z) {
    return (
        Math.floor(x) +
        "," +
        Math.floor(y) +
        "," +
        Math.floor(z)
    );
}

function getBlock(x, y, z) {
    return blocks.get(key(x, y, z));
}

function addBlock(x, y, z, type, category) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);

    const k = key(x, y, z);

    if (blocks.has(k)) {
        return false;
    }

    blocks.set(k, {
        x: x,
        y: y,
        z: z,
        type: type,
        category: category || "placed"
    });

    return true;
}

function removeBlock(x, y, z) {
    blocks.delete(key(x, y, z));
}


/* =========================================================
   TERRAIN
   ========================================================= */

const seed = Math.floor(Math.random() * 1000000000);

console.log("MintCraft World Seed:", seed);

function noise(x, z) {
    const value =
        Math.sin(
            x * 127.1 +
            z * 311.7 +
            seed
        ) * 43758.5453123;

    return value - Math.floor(value);
}

function getTerrainHeight(x, z) {
    const a =
        Math.sin(
            (x + seed * 0.00001) * 0.11
        ) * 2.5;

    const b =
        Math.cos(
            (z - seed * 0.00001) * 0.12
        ) * 2.5;

    const c =
        Math.sin(
            (x + z + seed * 0.00002) * 0.20
        ) * 1.2;

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(5 + a + b + c)
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
        const height = getTerrainHeight(x, z);

        terrain.set(
            x + "," + z,
            height
        );

        for (
            let y = -4;
            y < height;
            y++
        ) {
            let type;

            if (y === height - 1) {
                type = "grass";
            } else if (y >= height - 4) {
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


/* =========================================================
   TREES
   ========================================================= */

function treeNearby(x, z) {
    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {

            const h = terrain.get(
                (x + dx) + "," + (z + dz)
            );

            if (h === undefined) {
                continue;
            }

            const block = getBlock(
                x + dx,
                h,
                z + dz
            );

            if (
                block &&
                block.category === "tree"
            ) {
                return true;
            }
        }
    }

    return false;
}

function createTree(x, ground, z) {

    for (let y = 0; y < 4; y++) {
        addBlock(
            x,
            ground + y,
            z,
            "wood",
            "tree"
        );
    }

    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {

            if (
                Math.abs(dx) + Math.abs(dz) <= 3 &&
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

    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {

            if (
                dx !== 0 ||
                dz !== 0
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

        const ground = terrain.get(
            x + "," + z
        );

        if (ground === undefined) {
            continue;
        }

        if (
            noise(x, z) > 0.975 &&
            !treeNearby(x, z)
        ) {
            createTree(
                x,
                ground,
                z
            );
        }
    }
}


/* =========================================================
   OPTIMIZED RENDERING
   ========================================================= */

const worldGroup = new THREE.Group();

scene.add(worldGroup);

const meshes = {};
const raycastMeshes = [];

const dummy = new THREE.Object3D();

function rebuildWorld() {

    while (
        worldGroup.children.length > 0
    ) {
        const mesh =
            worldGroup.children[0];

        worldGroup.remove(mesh);

        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
    }

    for (const type of BLOCK_TYPES) {
        delete meshes[type];
    }

    raycastMeshes.length = 0;

    const groups = {};

    for (const block of blocks.values()) {

        if (!groups[block.type]) {
            groups[block.type] = [];
        }

        groups[block.type].push(block);
    }

    for (const type of BLOCK_TYPES) {

        const list =
            groups[type] || [];

        if (list.length === 0) {
            continue;
        }

        const geometry =
            new THREE.BoxGeometry(
                1,
                1,
                1
            );

        const mesh =
            new THREE.InstancedMesh(
                geometry,
                BLOCK_INFO[type].material,
                list.length
            );

        mesh.userData.blocks = list;
        mesh.userData.blockType = type;

        for (
            let i = 0;
            i < list.length;
            i++
        ) {

            const block = list[i];

            dummy.position.set(
                block.x,
                block.y,
                block.z
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
                i,
                dummy.matrix
            );
        }

        mesh.instanceMatrix.needsUpdate = true;

        worldGroup.add(mesh);

        meshes[type] = mesh;

        raycastMeshes.push(mesh);
    }
}

rebuildWorld();


/* =========================================================
   PLAYER
   ========================================================= */

const PLAYER_WIDTH = 0.6;
const PLAYER_DEPTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;

const MOVE_SPEED = 5;
const GRAVITY = 18;
const JUMP_POWER = 7;

const spawnHeight =
    terrain.get("0,5") || 5;

camera.position.set(
    0,
    spawnHeight + 0.55 + EYE_HEIGHT,
    5
);

let velocityY = 0;
let grounded = false;


/* =========================================================
   INPUT
   ========================================================= */

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

document.addEventListener(
    "keydown",
    function (event) {

        const k =
            event.key.toLowerCase();

        if (k === "w") keys.w = true;
        if (k === "a") keys.a = true;
        if (k === "s") keys.s = true;
        if (k === "d") keys.d = true;

        if (
            event.code === "Space"
        ) {
            keys.space = true;
        }

        if (
            k === "e"
        ) {
            toggleInventory();
        }

        if (
            k >= "1" &&
            k <= "8"
        ) {
            selectSlot(
                Number(k) - 1
            );
        }
    }
);

document.addEventListener(
    "keyup",
    function (event) {

        const k =
            event.key.toLowerCase();

        if (k === "w") keys.w = false;
        if (k === "a") keys.a = false;
        if (k === "s") keys.s = false;
        if (k === "d") keys.d = false;

        if (
            event.code === "Space"
        ) {
            keys.space = false;
        }
    }
);


/* =========================================================
   MOUSE LOOK
   ========================================================= */

let pointerLocked = false;

renderer.domElement.addEventListener(
    "click",
    function () {

        if (!inventoryOpen) {
            renderer.domElement.requestPointerLock();
        }
    }
);

document.addEventListener(
    "pointerlockchange",
    function () {

        pointerLocked =
            document.pointerLockElement ===
            renderer.domElement;
    }
);

document.addEventListener(
    "mousemove",
    function (event) {

        if (
            !pointerLocked ||
            inventoryOpen
        ) {
            return;
        }

        camera.rotation.y -=
            event.movementX * 0.002;

        camera.rotation.x -=
            event.movementY * 0.002;

        const limit =
            Math.PI / 2 - 0.05;

        camera.rotation.x =
            Math.max(
                -limit,
                Math.min(
                    limit,
                    camera.rotation.x
                )
            );
    }
);


/* =========================================================
   COLLISION
   ========================================================= */

function playerBox(x, feet, z) {

    return {
        minX:
            x - PLAYER_WIDTH / 2 + 0.001,

        maxX:
            x + PLAYER_WIDTH / 2 - 0.001,

        minY:
            feet + 0.001,

        maxY:
            feet + PLAYER_HEIGHT - 0.001,

        minZ:
            z - PLAYER_DEPTH / 2 + 0.001,

        maxZ:
            z + PLAYER_DEPTH / 2 - 0.001
    };
}

function boxHitsBlock(
    box,
    block
) {

    return (
        box.maxX > block.x - 0.5 &&
        box.minX < block.x + 0.5 &&

        box.maxY > block.y - 0.5 &&
        box.minY < block.y + 0.5 &&

        box.maxZ > block.z - 0.5 &&
        box.minZ < block.z + 0.5
    );
}

function collides(
    x,
    feet,
    z
) {

    const box =
        playerBox(
            x,
            feet,
            z
        );

    const minX =
        Math.floor(box.minX) - 1;

    const maxX =
        Math.floor(box.maxX) + 1;

    const minY =
        Math.floor(box.minY) - 1;

    const maxY =
        Math.floor(box.maxY) + 1;

    const minZ =
        Math.floor(box.minZ) - 1;

    const maxZ =
        Math.floor(box.maxZ) + 1;

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
                    boxHitsBlock(
                        box,
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


/* =========================================================
   GROUND DETECTION
   ========================================================= */

function findGround(
    x,
    feet,
    z
) {

    const halfX =
        PLAYER_WIDTH / 2 - 0.02;

    const halfZ =
        PLAYER_DEPTH / 2 - 0.02;

    const minX =
        Math.floor(x - halfX);

    const maxX =
        Math.floor(x + halfX);

    const minZ =
        Math.floor(z - halfZ);

    const maxZ =
        Math.floor(z + halfZ);

    let best = -Infinity;

    /*
       Search several blocks downward.
       This prevents the player from falling
       through terrain when moving quickly.
    */

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
                let by = Math.floor(feet + 0.5);
                by >= -10;
                by--
            ) {

                const block =
                    getBlock(
                        bx,
                        by,
                        bz
                    );

                if (!block) {
                    continue;
                }

                const top =
                    block.y + 0.5;

                if (
                    top <= feet + 0.15 &&
                    top > best
                ) {
                    best = top;
                }

                break;
            }
        }
    }

    return best;
}


/* =========================================================
   MOVEMENT
   ========================================================= */

const forward =
    new THREE.Vector3();

const right =
    new THREE.Vector3();

function movePlayer(delta) {

    if (inventoryOpen) {
        return;
    }

    let forwardInput = 0;
    let rightInput = 0;

    if (keys.w) {
        forwardInput += 1;
    }

    if (keys.s) {
        forwardInput -= 1;
    }

    if (keys.a) {
        rightInput -= 1;
    }

    if (keys.d) {
        rightInput += 1;
    }

    if (
        forwardInput === 0 &&
        rightInput === 0
    ) {
        return;
    }

    const length =
        Math.sqrt(
            forwardInput *
            forwardInput +
            rightInput *
            rightInput
        );

    forwardInput /= length;
    rightInput /= length;

    /*
       Use camera rotation directly.
       This keeps W going where the player
       is looking without affecting gravity.
    */

    const yaw =
        camera.rotation.y;

    forward.set(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );

    right.set(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    );

    const distance =
        MOVE_SPEED * delta;

    const moveX =
        (
            forward.x *
            forwardInput
        ) +
        (
            right.x *
            rightInput
        );

    const moveZ =
        (
            forward.z *
            forwardInput
        ) +
        (
            right.z *
            rightInput
        );

    const dx =
        moveX * distance;

    const dz =
        moveZ * distance;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    /*
       X and Z are checked separately.
       This lets the player slide along walls.
    */

    if (
        !collides(
            camera.position.x + dx,
            feet,
            camera.position.z
        )
    ) {
        camera.position.x += dx;
    }

    if (
        !collides(
            camera.position.x,
            feet,
            camera.position.z + dz
        )
    ) {
        camera.position.z += dz;
    }
}


/* =========================================================
   PHYSICS
   ========================================================= */

function updatePhysics(delta) {

    if (inventoryOpen) {
        return;
    }

    let feet =
        camera.position.y -
        EYE_HEIGHT;

    /*
       Find the block directly underneath.
    */

    const ground =
        findGround(
            camera.position.x,
            feet,
            camera.position.z
        );

    /*
       Jump.
    */

    if (
        keys.space &&
        (
            grounded ||
            (
                ground !== -Infinity &&
                Math.abs(
                    feet - ground
                ) < 0.12
            )
        )
    ) {

        velocityY =
            JUMP_POWER;

        grounded = false;

        keys.space = false;
    }

    /*
       Gravity.
    */

    velocityY -=
        GRAVITY * delta;

    if (
        velocityY < -30
    ) {
        velocityY = -30;
    }

    /*
       Falling.
    */

    if (
        velocityY <= 0
    ) {

        const newFeet =
            feet +
            velocityY * delta;

        const newGround =
            findGround(
                camera.position.x,
                feet + 0.05,
                camera.position.z
            );

        if (
            newGround !== -Infinity &&
            newFeet <= newGround &&
            feet >= newGround - 1.0
        ) {

            feet =
                newGround;

            velocityY = 0;

            grounded = true;

        } else {

            feet =
                newFeet;

            grounded = false;
        }

    } else {

        /*
           Moving upward.
           Check the player's head rather
           than the whole player box.
        */

        const newFeet =
            feet +
            velocityY * delta;

        const oldHead =
            feet + PLAYER_HEIGHT;

        const newHead =
            newFeet + PLAYER_HEIGHT;

        const halfX =
            PLAYER_WIDTH / 2 - 0.02;

        const halfZ =
            PLAYER_DEPTH / 2 - 0.02;

        const minX =
            Math.floor(
                camera.position.x - halfX
            );

        const maxX =
            Math.floor(
                camera.position.x + halfX
            );

        const minZ =
            Math.floor(
                camera.position.z - halfZ
            );

        const maxZ =
            Math.floor(
                camera.position.z + halfZ
            );

        let hitHead = false;

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
                        Math.floor(oldHead);
                    by <=
                        Math.ceil(newHead);
                    by++
                ) {

                    const block =
                        getBlock(
                            bx,
                            by,
                            bz
                        );

                    if (!block) {
                        continue;
                    }

                    const bottom =
                        block.y - 0.5;

                    const top =
                        block.y + 0.5;

                    if (
                        newHead > bottom &&
                        oldHead <= top
                    ) {
                        hitHead = true;
                    }
                }
            }
        }

        if (hitHead) {
            velocityY = 0;
        } else {
            feet = newFeet;
        }

        grounded = false;
    }

    /*
       Safety check:
       if somehow inside a block, move upward
       until the player is clear.
    */

    let safety = 0;

    while (
        collides(
            camera.position.x,
            feet,
            camera.position.z
        ) &&
        safety < 20
    ) {

        feet += 0.1;
        safety++;
    }

    camera.position.y =
        feet + EYE_HEIGHT;
}


/* =========================================================
   INVENTORY
   ========================================================= */

const inventory = {
    grass: 20,
    dirt: 20,
    stone: 20,
    wood: 20,
    leaves: 20,
    planks: 20,
    glass: 20,
    bricks: 20
};

let selectedType = "grass";
let selectedSlot = 0;
let inventoryOpen = false;


/* =========================================================
   HOTBAR
   ========================================================= */

const hotbar =
    document.createElement("div");

hotbar.style.position = "fixed";
hotbar.style.bottom = "20px";
hotbar.style.left = "50%";
hotbar.style.transform =
    "translateX(-50%)";

hotbar.style.display = "flex";
hotbar.style.gap = "5px";

hotbar.style.zIndex = "20";

document.body.appendChild(hotbar);

const hotbarSlots = [];

function selectSlot(index) {

    if (
        index < 0 ||
        index >= BLOCK_TYPES.length
    ) {
        return;
    }

    selectedSlot = index;

    selectedType =
        BLOCK_TYPES[index];

    updateHotbar();
}

function updateHotbar() {

    for (
        let i = 0;
        i < hotbarSlots.length;
        i++
    ) {

        const slot =
            hotbarSlots[i];

        const type =
            BLOCK_TYPES[i];

        slot.style.border =
            i === selectedSlot
                ? "3px solid white"
                : "2px solid #555";

        slot.innerHTML =
            "<div style='font-size:12px'>" +
            (i + 1) +
            "</div>" +

            "<div style='font-size:11px'>" +
            type +
            "</div>" +

            "<div style='font-size:12px'>" +
            inventory[type] +
            "</div>";
    }
}

for (
    let i = 0;
    i < BLOCK_TYPES.length;
    i++
) {

    const slot =
        document.createElement("div");

    slot.style.width = "62px";
    slot.style.height = "48px";

    slot.style.background =
        "rgba(0,0,0,0.65)";

    slot.style.color = "white";

    slot.style.fontFamily =
        "Arial";

    slot.style.textAlign =
        "center";

    slot.style.border =
        "2px solid #555";

    slot.style.boxSizing =
        "border-box";

    slot.style.cursor =
        "pointer";

    slot.addEventListener(
        "click",
        function () {
            selectSlot(i);
        }
    );

    hotbar.appendChild(slot);

    hotbarSlots.push(slot);
}

updateHotbar();


/* =========================================================
   INVENTORY SCREEN
   ========================================================= */

const inventoryScreen =
    document.createElement("div");

inventoryScreen.style.position =
    "fixed";

inventoryScreen.style.left = "50%";
inventoryScreen.style.top = "50%";

inventoryScreen.style.transform =
    "translate(-50%, -50%)";

inventoryScreen.style.background =
    "rgba(30,30,30,0.96)";

inventoryScreen.style.padding =
    "20px";

inventoryScreen.style.border =
    "3px solid white";

inventoryScreen.style.color =
    "white";

inventoryScreen.style.fontFamily =
    "Arial";

inventoryScreen.style.display =
    "none";

inventoryScreen.style.zIndex =
    "30";

inventoryScreen.style.minWidth =
    "430px";

document.body.appendChild(
    inventoryScreen
);

function updateInventory() {

    inventoryScreen.innerHTML =
        "<h2 style='margin-top:0'>" +
        "Inventory" +
        "</h2>" +

        "<p>Press E to close</p>";

    const grid =
        document.createElement("div");

    grid.style.display =
        "grid";

    grid.style.gridTemplateColumns =
        "repeat(4, 90px)";

    grid.style.gap =
        "8px";

    for (
        let i = 0;
        i < BLOCK_TYPES.length;
        i++
    ) {

        const type =
            BLOCK_TYPES[i];

        const item =
            document.createElement("div");

        item.style.height =
            "70px";

        item.style.background =
            "rgba(255,255,255,0.1)";

        item.style.border =
            "2px solid #777";

        item.style.textAlign =
            "center";

        item.style.padding =
            "5px";

        item.style.boxSizing =
            "border-box";

        item.style.cursor =
            "pointer";

        item.innerHTML =
            "<b>" +
            type +
            "</b><br>" +

            "x" +
            inventory[type] +
            "<br>" +

            "<small>Click to select</small>";

        item.addEventListener(
            "click",
            function () {

                selectedType = type;

                selectedSlot =
                    BLOCK_TYPES.indexOf(
                        type
                    );

                updateHotbar();

                toggleInventory();
            }
        );

        grid.appendChild(item);
    }

    inventoryScreen.appendChild(
        grid
    );
}

function toggleInventory() {

    inventoryOpen =
        !inventoryOpen;

    if (inventoryOpen) {

        inventoryScreen.style.display =
            "block";

        updateInventory();

        if (
            document.pointerLockElement
        ) {
            document.exitPointerLock();
        }

    } else {

        inventoryScreen.style.display =
            "none";
    }
}


/* =========================================================
   BLOCK TARGETING
   ========================================================= */

const raycaster =
    new THREE.Raycaster();

const screenCenter =
    new THREE.Vector2(0, 0);

let targetBlock = null;
let targetNormal = null;


/* =========================================================
   BLOCK HIGHLIGHT
   ========================================================= */

const highlight =
    new THREE.LineSegments(
        new THREE.EdgesGeometry(
            new THREE.BoxGeometry(
                1.02,
                1.02,
                1.02
            )
        ),
        new THREE.LineBasicMaterial({
            color: 0xffffff
        })
    );

highlight.visible = false;

scene.add(highlight);


function getTargetBlock() {

    raycaster.setFromCamera(
        screenCenter,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            raycastMeshes,
            false
        );

    if (
        hits.length === 0
    ) {
        targetBlock = null;
        targetNormal = null;
        highlight.visible = false;
        return;
    }

    const hit = hits[0];

    const list =
        hit.object.userData.blocks;

    if (
        !list ||
        hit.instanceId === undefined
    ) {
        targetBlock = null;
        targetNormal = null;
        highlight.visible = false;
        return;
    }

    const block =
        list[hit.instanceId];

    if (!block) {
        targetBlock = null;
        targetNormal = null;
        highlight.visible = false;
        return;
    }

    targetBlock = block;

    targetNormal =
        hit.face.normal.clone();

    highlight.position.set(
        block.x,
        block.y,
        block.z
    );

    highlight.visible = true;
}


/* =========================================================
   BREAK BLOCK
   ========================================================= */

function breakBlock() {

    if (!targetBlock) {
        return;
    }

    const block =
        targetBlock;

    /*
       Don't allow breaking the very bottom
       protection layer.
    */

    if (block.y < -4) {
        return;
    }

    /*
       Give the block to inventory.
       Trees can also be collected.
    */

    if (
        inventory[block.type] !== undefined
    ) {
        inventory[block.type]++;
    }

    removeBlock(
        block.x,
        block.y,
        block.z
    );

    targetBlock = null;

    highlight.visible = false;

    rebuildWorld();

    updateHotbar();

    if (inventoryOpen) {
        updateInventory();
    }
}


/* =========================================================
   PLACE BLOCK
   ========================================================= */

function placeBlock() {

    if (
        !targetBlock ||
        !targetNormal
    ) {
        return;
    }

    if (
        inventory[selectedType] <= 0
    ) {
        return;
    }

    const x =
        targetBlock.x +
        Math.round(targetNormal.x);

    const y =
        targetBlock.y +
        Math.round(targetNormal.y);

    const z =
        targetBlock.z +
        Math.round(targetNormal.z);

    /*
       Don't place inside the player.
    */

    const testFeet =
        camera.position.y -
        EYE_HEIGHT;

    if (
        collides(
            camera.position.x,
            testFeet,
            camera.position.z
        )
    ) {
        return;
    }

    const newBlock = {
        x: x,
        y: y,
        z: z,
        type: selectedType,
        category: "placed"
    };

    const playerBoxData =
        playerBox(
            camera.position.x,
            testFeet,
            camera.position.z
        );

    if (
        boxHitsBlock(
            playerBoxData,
            newBlock
        )
    ) {
        return;
    }

    if (
        addBlock(
            x,
            y,
            z,
            selectedType,
            "placed"
        )
    ) {

        inventory[selectedType]--;

        rebuildWorld();

        updateHotbar();

        if (inventoryOpen) {
            updateInventory();
        }
    }
}


/* =========================================================
   MOUSE BUTTONS
   ========================================================= */

document.addEventListener(
    "mousedown",
    function (event) {

        if (inventoryOpen) {
            return;
        }

        if (!pointerLocked) {
            return;
        }

        if (event.button === 0) {
            breakBlock();
        }

        if (event.button === 2) {
            placeBlock();
        }
    }
);

document.addEventListener(
    "contextmenu",
    function (event) {
        event.preventDefault();
    }
);


/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    function () {

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


/* =========================================================
   GAME LOOP
   ========================================================= */

const clock =
    new THREE.Clock();

let lastTargetCheck = 0;

function gameLoop() {

    requestAnimationFrame(
        gameLoop
    );

    let delta =
        clock.getDelta();

    /*
       Prevent huge physics jumps if
       the browser freezes for a moment.
    */

    delta =
        Math.min(delta, 0.05);

    movePlayer(delta);

    updatePhysics(delta);

    /*
       Raycasting every frame is unnecessary.
       30 times per second is enough.
    */

    lastTargetCheck += delta;

    if (
        lastTargetCheck > 0.033
    ) {

        getTargetBlock();

        lastTargetCheck = 0;
    }

    renderer.render(
        scene,
        camera
    );
}

gameLoop();
```
