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
// TEXTURES
// =====================================================

const textureLoader = new THREE.TextureLoader();

const grassTopTexture =
    textureLoader.load("./textures/grass_top.png");

const grassSideTexture =
    textureLoader.load("./textures/grass_side.png");

const dirtTexture =
    textureLoader.load("./textures/dirt.png");

const stoneTexture =
    textureLoader.load("./textures/stone.png");

const woodSideTexture =
    textureLoader.load("./textures/wood_side.png");

const woodTopTexture =
    textureLoader.load("./textures/wood_top.png");

const leavesTexture =
    textureLoader.load("./textures/leaves.png");

const planksTexture =
    textureLoader.load("./textures/planks.png");

const glassTexture =
    textureLoader.load("./textures/glass.png");

const bricksTexture =
    textureLoader.load("./textures/bricks.png");

// =====================================================
// BLOCK MATERIALS
// =====================================================

const grassMaterial = [
    new THREE.MeshLambertMaterial({
        map: grassSideTexture
    }),
    new THREE.MeshLambertMaterial({
        map: grassSideTexture
    }),
    new THREE.MeshLambertMaterial({
        map: grassTopTexture
    }),
    new THREE.MeshLambertMaterial({
        map: dirtTexture
    }),
    new THREE.MeshLambertMaterial({
        map: grassSideTexture
    }),
    new THREE.MeshLambertMaterial({
        map: grassSideTexture
    })
];

const dirtMaterial =
    new THREE.MeshLambertMaterial({
        map: dirtTexture
    });

const stoneMaterial =
    new THREE.MeshLambertMaterial({
        map: stoneTexture
    });

const woodMaterial = [
    new THREE.MeshLambertMaterial({
        map: woodSideTexture
    }),
    new THREE.MeshLambertMaterial({
        map: woodSideTexture
    }),
    new THREE.MeshLambertMaterial({
        map: woodTopTexture
    }),
    new THREE.MeshLambertMaterial({
        map: woodTopTexture
    }),
    new THREE.MeshLambertMaterial({
        map: woodSideTexture
    }),
    new THREE.MeshLambertMaterial({
        map: woodSideTexture
    })
];

const leavesMaterial =
    new THREE.MeshLambertMaterial({
        map: leavesTexture,
        transparent: true,
        alphaTest: 0.1
    });

const planksMaterial =
    new THREE.MeshLambertMaterial({
        map: planksTexture
    });

const glassMaterial =
    new THREE.MeshLambertMaterial({
        map: glassTexture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
    });

const bricksMaterial =
    new THREE.MeshLambertMaterial({
        map: bricksTexture
    });

// =====================================================
// BLOCK INFORMATION
// =====================================================

const blockInfo = {
    grass: {
        name: "Grass",
        material: grassMaterial,
        texture: "./textures/grass_top.png"
    },

    dirt: {
        name: "Dirt",
        material: dirtMaterial,
        texture: "./textures/dirt.png"
    },

    stone: {
        name: "Stone",
        material: stoneMaterial,
        texture: "./textures/stone.png"
    },

    wood: {
        name: "Wood",
        material: woodMaterial,
        texture: "./textures/wood_side.png"
    },

    leaves: {
        name: "Leaves",
        material: leavesMaterial,
        texture: "./textures/leaves.png"
    },

    planks: {
        name: "Planks",
        material: planksMaterial,
        texture: "./textures/planks.png"
    },

    glass: {
        name: "Glass",
        material: glassMaterial,
        texture: "./textures/glass.png"
    },

    bricks: {
        name: "Bricks",
        material: bricksMaterial,
        texture: "./textures/bricks.png"
    }
};

const blockTypes = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves",
    "planks",
    "glass",
    "bricks"
];

let selectedMaterial = grassMaterial;
let selectedBlockType = "grass";

// =====================================================
// INVENTORY
// =====================================================

const inventory = {
    grass: 20,
    dirt: 20,
    stone: 20,
    wood: 10,
    leaves: 10,
    planks: 20,
    glass: 10,
    bricks: 20
};

let inventoryOpen = false;

// =====================================================
// BLOCKS
// =====================================================

const blocks = [];

function createBlock(x, y, z, material, type) {

    const geometry =
        new THREE.BoxGeometry(1, 1, 1);

    const block =
        new THREE.Mesh(
            geometry,
            material
        );

    block.position.set(x, y, z);

    block.userData.blockType = type;

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

    const value =
        Math.sin(
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
        Math.sin(
            (x + seed) * 0.12
        ) * 3;

    const valleys =
        Math.cos(
            (z - seed) * 0.11
        ) * 3;

    const smaller =
        Math.sin(
            (x + z) * 0.2
        ) * 1.5;

    let height =
        5 +
        hills +
        valleys +
        smaller;

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(height)
        )
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
            woodMaterial,
            "wood"
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
                        leavesMaterial,
                        "leaves"
                    );
                }
            }
        }
    }

    createBlock(
        x,
        y + 5,
        z,
        leavesMaterial,
        "leaves"
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
            let type;

            if (
                y === height - 1
            ) {

                material =
                    grassMaterial;

                type = "grass";

            } else if (
                y >= height - 4
            ) {

                material =
                    dirtMaterial;

                type = "dirt";

            } else {

                material =
                    stoneMaterial;

                type = "stone";
            }

            createBlock(
                x,
                y,
                z,
                material,
                type
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

        // INVENTORY
        if (
            event.code === "KeyE" &&
            !event.repeat
        ) {

            toggleInventory();

            return;
        }

        if (inventoryOpen) {
            return;
        }

        // HOTBAR 1-8
        if (
            event.code === "Digit1"
        ) {
            selectBlock("grass");
        }

        if (
            event.code === "Digit2"
        ) {
            selectBlock("dirt");
        }

        if (
            event.code === "Digit3"
        ) {
            selectBlock("stone");
        }

        if (
            event.code === "Digit4"
        ) {
            selectBlock("wood");
        }

        if (
            event.code === "Digit5"
        ) {
            selectBlock("leaves");
        }

        if (
            event.code === "Digit6"
        ) {
            selectBlock("planks");
        }

        if (
            event.code === "Digit7"
        ) {
            selectBlock("glass");
        }

        if (
            event.code === "Digit8"
        ) {
            selectBlock("bricks");
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
// SELECT BLOCK
// =====================================================

function selectBlock(type) {

    if (
        inventory[type] <= 0
    ) {
        return;
    }

    selectedBlockType = type;

    selectedMaterial =
        blockInfo[type].material;

    updateHotbar();
    updateInventory();
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

        if (inventoryOpen) {
            return;
        }

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

        if (!mouseLocked) {
            return;
        }

        if (inventoryOpen) {
            return;
        }

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
// COLLISION HELPERS
// =====================================================

function blockAt(x, y, z) {

    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);

    for (
        const block of blocks
    ) {

        if (
            Math.round(
                block.position.x
            ) === bx &&
            Math.round(
                block.position.y
            ) === by &&
            Math.round(
                block.position.z
            ) === bz
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

    for (
        const block of blocks
    ) {

        if (
            Math.round(
                block.position.x
            ) === bx &&
            Math.round(
                block.position.z
            ) === bz
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
// MOVEMENT
// =====================================================

function tryMove(dx, dz) {

    if (inventoryOpen) {
        return;
    }

    const oldX =
        camera.position.x;

    const oldZ =
        camera.position.z;

    camera.position.x += dx;

    if (
        blockAt(
            camera.position.x,
            camera.position.y - 0.5,
            camera.position.z
        )
    ) {

        camera.position.x =
            oldX;
    }

    camera.position.z += dz;

    if (
        blockAt(
            camera.position.x,
            camera.position.y - 0.5,
            camera.position.z
        )
    ) {

        camera.position.z =
            oldZ;
    }
}

// =====================================================
// PHYSICS
// =====================================================

function updatePhysics() {

    if (inventoryOpen) {
        return;
    }

    const ground =
        groundHeight(
            camera.position.x,
            camera.position.z
        );

    const feet =
        camera.position.y -
        PLAYER_HEIGHT / 2;

    if (feet > ground) {

        velocityY -= gravity;

        camera.position.y +=
            velocityY;

        grounded = false;
    }

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
    "20";

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
    "20";

document.body.appendChild(
    hotbar
);

const hotbarSlots = [];

for (
    let i = 0;
    i < blockTypes.length;
    i++
) {

    const type =
        blockTypes[i];

    const slot =
        document.createElement("div");

    slot.style.width =
        "60px";

    slot.style.height =
        "60px";

    slot.style.background =
        "rgba(40,40,40,0.9)";

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

    slot.style.cursor =
        "pointer";

    const preview =
        document.createElement("img");

    preview.src =
        blockInfo[type].texture;

    preview.style.width =
        "42px";

    preview.style.height =
        "42px";

    preview.style.imageRendering =
        "pixelated";

    slot.appendChild(
        preview
    );

    const number =
        document.createElement("div");

    number.innerText =
        String(i + 1);

    number.style.position =
        "absolute";

    number.style.left =
        "4px";

    number.style.top =
        "2px";

    number.style.color =
        "white";

    number.style.fontWeight =
        "bold";

    number.style.textShadow =
        "2px 2px 2px black";

    slot.appendChild(
        number
    );

    const count =
        document.createElement("div");

    count.style.position =
        "absolute";

    count.style.right =
        "4px";

    count.style.bottom =
        "2px";

    count.style.color =
        "white";

    count.style.fontWeight =
        "bold";

    count.style.fontSize =
        "14px";

    count.style.textShadow =
        "2px 2px 2px black";

    slot.appendChild(
        count
    );

    slot.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            selectBlock(type);
        }
    );

    hotbar.appendChild(
        slot
    );

    hotbarSlots.push({
        element: slot,
        count: count,
        type: type
    });
}

function updateHotbar() {

    for (
        const slot of hotbarSlots
    ) {

        slot.count.innerText =
            String(
                inventory[
                    slot.type
                ]
            );

        if (
            slot.type ===
            selectedBlockType
        ) {

            slot.element.style.border =
                "4px solid white";

        } else {

            slot.element.style.border =
                "3px solid #777";
        }

        if (
            inventory[
                slot.type
            ] <= 0
        ) {

            slot.element.style.opacity =
                "0.35";

        } else {

            slot.element.style.opacity =
                "1";
        }
    }
}

// =====================================================
// INVENTORY SCREEN
// =====================================================

const inventoryScreen =
    document.createElement("div");

inventoryScreen.style.position =
    "fixed";

inventoryScreen.style.left =
    "50%";

inventoryScreen.style.top =
    "50%";

inventoryScreen.style.transform =
    "translate(-50%, -50%)";

inventoryScreen.style.width =
    "520px";

inventoryScreen.style.padding =
    "20px";

inventoryScreen.style.background =
    "rgba(25,25,25,0.97)";

inventoryScreen.style.border =
    "4px solid #555";

inventoryScreen.style.borderRadius =
    "6px";

inventoryScreen.style.zIndex =
    "100";

inventoryScreen.style.display =
    "none";

inventoryScreen.style.color =
    "white";

inventoryScreen.style.fontFamily =
    "Arial, sans-serif";

inventoryScreen.style.boxSizing =
    "border-box";

document.body.appendChild(
    inventoryScreen
);

// =====================================================
// INVENTORY TITLE
// =====================================================

const inventoryTitle =
    document.createElement("div");

inventoryTitle.innerText =
    "Inventory";

inventoryTitle.style.textAlign =
    "center";

inventoryTitle.style.fontSize =
    "28px";

inventoryTitle.style.fontWeight =
    "bold";

inventoryTitle.style.marginBottom =
    "18px";

inventoryScreen.appendChild(
    inventoryTitle
);

// =====================================================
// INVENTORY GRID
// =====================================================

const inventoryGrid =
    document.createElement("div");

inventoryGrid.style.display =
    "grid";

inventoryGrid.style.gridTemplateColumns =
    "repeat(4, 1fr)";

inventoryGrid.style.gap =
    "10px";

inventoryScreen.appendChild(
    inventoryGrid
);

const inventorySlots = [];

for (
    let i = 0;
    i < blockTypes.length;
    i++
) {

    const type =
        blockTypes[i];

    const slot =
        document.createElement("div");

    slot.style.height =
        "100px";

    slot.style.background =
        "rgba(50,50,50,0.9)";

    slot.style.border =
        "3px solid #666";

    slot.style.position =
        "relative";

    slot.style.cursor =
        "pointer";

    slot.style.boxSizing =
        "border-box";

    const image =
        document.createElement("img");

    image.src =
        blockInfo[type].texture;

    image.style.position =
        "absolute";

    image.style.width =
        "52px";

    image.style.height =
        "52px";

    image.style.left =
        "50%";

    image.style.top =
        "8px";

    image.style.transform =
        "translateX(-50%)";

    image.style.imageRendering =
        "pixelated";

    slot.appendChild(
        image
    );

    const name =
        document.createElement("div");

    name.innerText =
        blockInfo[type].name;

    name.style.position =
        "absolute";

    name.style.bottom =
        "25px";

    name.style.left =
        "0";

    name.style.right =
        "0";

    name.style.textAlign =
        "center";

    name.style.fontSize =
        "13px";

    slot.appendChild(
        name
    );

    const count =
        document.createElement("div");

    count.style.position =
        "absolute";

    count.style.bottom =
        "5px";

    count.style.left =
        "0";

    count.style.right =
        "0";

    count.style.textAlign =
        "center";

    count.style.fontSize =
        "16px";

    count.style.fontWeight =
        "bold";

    slot.appendChild(
        count
    );

    slot.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            if (
                inventory[type] > 0
            ) {

                selectBlock(type);

                closeInventory();
            }
        }
    );

    inventoryGrid.appendChild(
        slot
    );

    inventorySlots.push({
        element: slot,
        count: count,
        type: type
    });
}

// =====================================================
// INVENTORY HELP
// =====================================================

const inventoryHelp =
    document.createElement("div");

inventoryHelp.innerText =
    "Click a block to select it • Press E to close";

inventoryHelp.style.textAlign =
    "center";

inventoryHelp.style.marginTop =
    "18px";

inventoryHelp.style.color =
    "#bbbbbb";

inventoryHelp.style.fontSize =
    "14px";

inventoryScreen.appendChild(
    inventoryHelp
);

// =====================================================
// UPDATE INVENTORY
// =====================================================

function updateInventory() {

    for (
        const slot of inventorySlots
    ) {

        slot.count.innerText =
            "x" +
            inventory[
                slot.type
            ];

        if (
            slot.type ===
            selectedBlockType
        ) {

            slot.element.style.border =
                "4px solid white";

        } else {

            slot.element.style.border =
                "3px solid #666";
        }

        if (
            inventory[
                slot.type
            ] <= 0
        ) {

            slot.element.style.opacity =
                "0.35";

        } else {

            slot.element.style.opacity =
                "1";
        }
    }
}

// =====================================================
// OPEN INVENTORY
// =====================================================

function openInventory() {

    inventoryOpen = true;

    inventoryScreen.style.display =
        "block";

    if (
        document.pointerLockElement ===
        renderer.domElement
    ) {

        document.exitPointerLock();
    }

    if (highlight) {

        highlight.visible =
            false;
    }

    updateInventory();
    updateHotbar();
}

// =====================================================
// CLOSE INVENTORY
// =====================================================

function closeInventory() {

    inventoryOpen = false;

    inventoryScreen.style.display =
        "none";

    updateInventory();
    updateHotbar();
}

// =====================================================
// TOGGLE INVENTORY
// =====================================================

function toggleInventory() {

    if (inventoryOpen) {

        closeInventory();

    } else {

        openInventory();
    }
}

// =====================================================
// BLOCK HIGHLIGHT
// =====================================================

const raycaster =
    new THREE.Raycaster();

const center =
    new THREE.Vector2(0, 0);

let highlight = null;

function updateHighlight() {

    if (inventoryOpen) {

        if (highlight) {
            highlight.visible = false;
        }

        return;
    }

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

            highlight.visible =
                false;
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

    highlight.visible = true;

    highlight.position.copy(
        block.position
    );
}

// =====================================================
// GET TARGET
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

// =====================================================
// BREAK BLOCK
// =====================================================

function breakBlock() {

    if (inventoryOpen) {
        return;
    }

    const hit =
        getTarget();

    if (!hit) {
        return;
    }

    const block =
        hit.object;

    const type =
        block.userData.blockType;

    if (!type) {
        return;
    }

    // Don't destroy the bottom layer
    if (
        block.position.y <= -4
    ) {

        return;
    }

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

    // Add block to inventory
    inventory[type]++;

    updateInventory();
    updateHotbar();
}

// =====================================================
// PLACE BLOCK
// =====================================================

function placeBlock() {

    if (inventoryOpen) {
        return;
    }

    // Need at least one block
    if (
        inventory[
            selectedBlockType
        ] <= 0
    ) {

        return;
    }

    const hit =
        getTarget();

    if (!hit) {
        return;
    }

    const position =
        hit.object.position.clone();

    position.add(
        hit.face.normal
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
        selectedMaterial,
        selectedBlockType
    );

    // Remove one from inventory
    inventory[
        selectedBlockType
    ]--;

    updateInventory();
    updateHotbar();
}

// =====================================================
// MOUSE BUTTONS
// =====================================================

renderer.domElement.addEventListener(
    "mousedown",
    event => {

        if (inventoryOpen) {
            return;
        }

        if (!mouseLocked) {
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

// =====================================================
// GAME LOOP
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );

    if (!inventoryOpen) {

        const speed = 0.08;

        let forward = 0;
        let right = 0;

        if (
            keys["KeyW"]
        ) {

            forward += speed;
        }

        if (
            keys["KeyS"]
        ) {

            forward -= speed;
        }

        if (
            keys["KeyD"]
        ) {

            right += speed;
        }

        if (
            keys["KeyA"]
        ) {

            right -= speed;
        }

        const moveX =
            Math.sin(yaw) *
            forward +
            Math.cos(yaw) *
            right;

        const moveZ =
            Math.cos(yaw) *
            forward -
            Math.sin(yaw) *
            right;

        tryMove(
            moveX,
            moveZ
        );

        updatePhysics();
    }

    updateHighlight();

    renderer.render(
        scene,
        camera
    );
}

updateHotbar();
updateInventory();

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
