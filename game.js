import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ============================================================
// MINTCRAFT
// Optimized version
// ============================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// ============================================================
// LIGHTING
// ============================================================

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(30, 50, 20);
scene.add(sun);

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.5
    )
);

// ============================================================
// TEXTURES
// ============================================================

const textureLoader = new THREE.TextureLoader();

function loadTexture(file) {
    const texture = textureLoader.load(
        "textures/" + file
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

function solidMaterial(texture) {
    return new THREE.MeshLambertMaterial({
        map: texture
    });
}

const grassSideMaterial =
    solidMaterial(textures.grassSide);

const grassTopMaterial =
    solidMaterial(textures.grassTop);

const dirtMaterial =
    solidMaterial(textures.dirt);

const stoneMaterial =
    solidMaterial(textures.stone);

const woodSideMaterial =
    solidMaterial(textures.woodSide);

const woodTopMaterial =
    solidMaterial(textures.woodTop);

const leavesMaterial =
    new THREE.MeshLambertMaterial({
        map: textures.leaves,
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.05,
        depthWrite: false
    });

const planksMaterial =
    solidMaterial(textures.planks);

const glassMaterial =
    new THREE.MeshLambertMaterial({
        map: textures.glass,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
    });

const bricksMaterial =
    solidMaterial(textures.bricks);

// ============================================================
// BLOCK TYPES
// ============================================================

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

let selectedType = "grass";

// ============================================================
// WORLD STORAGE
// ============================================================

const blockMap = new Map();
const terrainHeights = new Map();

function blockKey(x, y, z) {
    return (
        Math.floor(x) +
        "," +
        Math.floor(y) +
        "," +
        Math.floor(z)
    );
}

function getBlock(x, y, z) {
    return blockMap.get(
        blockKey(x, y, z)
    );
}

function setBlock(
    x,
    y,
    z,
    type,
    category = "placed"
) {
    const key = blockKey(x, y, z);

    if (blockMap.has(key)) {
        return false;
    }

    blockMap.set(key, {
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        type: type,
        category: category
    });

    return true;
}

function deleteBlock(x, y, z) {
    return blockMap.delete(
        blockKey(x, y, z)
    );
}

// ============================================================
// WORLD GENERATION
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
        ) *
        43758.5453123;

    return value - Math.floor(value);
}

const WORLD_SIZE = 25;

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
            x + "," + z,
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
            }
            else if (
                y >= height - 4
            ) {
                type = "dirt";
            }
            else {
                type = "stone";
            }

            setBlock(
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
                    (x + dx) +
                    "," +
                    (z + dz)
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

        setBlock(
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

                setBlock(
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

                setBlock(
                    x + dx,
                    ground + 4,
                    z + dz,
                    "leaves",
                    "tree"
                );
            }
        }
    }

    setBlock(
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
                x + "," + z
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
// OPTIMIZED WORLD RENDERING
// ============================================================

const worldGroup =
    new THREE.Group();

scene.add(worldGroup);

const blockMeshes = {};

const dummy =
    new THREE.Object3D();

const meshTypeList = [];

function rebuildWorldMeshes() {

    while (
        worldGroup.children.length > 0
    ) {

        const child =
            worldGroup.children[
                0
            ];

        worldGroup.remove(child);

        if (
            child.geometry
        ) {
            child.geometry.dispose();
        }
    }

    for (
        const type of BLOCK_TYPES
    ) {

        delete blockMeshes[type];
    }

    const grouped = {};

    for (
        const block of blockMap.values()
    ) {

        if (
            !grouped[block.type]
        ) {
            grouped[block.type] = [];
        }

        grouped[block.type].push(
            block
        );
    }

    for (
        const type of BLOCK_TYPES
    ) {

        const list =
            grouped[type] || [];

        if (
            list.length === 0
        ) {
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

        mesh.userData.type =
            type;

        mesh.userData.blocks =
            list;

        for (
            let i = 0;
            i < list.length;
            i++
        ) {

            const block =
                list[i];

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

        mesh.instanceMatrix.needsUpdate =
            true;

        worldGroup.add(mesh);

        blockMeshes[type] =
            mesh;
    }

    meshTypeList.length = 0;

    for (
        const type of BLOCK_TYPES
    ) {

        if (
            blockMeshes[type]
        ) {

            meshTypeList.push(
                blockMeshes[type]
            );
        }
    }
}

rebuildWorldMeshes();

// ============================================================
// PLAYER
// ============================================================

const PLAYER_WIDTH = 0.6;
const PLAYER_DEPTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;

const spawnHeight =
    terrainHeights.get("0,5") || 5;

camera.position.set(
    0,
    spawnHeight - 0.5 +
    EYE_HEIGHT +
    0.03,
    5
);

let velocityY = 0;

const GRAVITY = 18;
const JUMP_POWER = 7;

let grounded = false;

// ============================================================
// INVENTORY
// ============================================================

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

            event.preventDefault();
        }

        if (
            event.code === "KeyE"
        ) {

            if (!event.repeat) {
                toggleInventory();
            }

            event.preventDefault();
        }

        const number =
            Number(event.key);

        if (
            number >= 1 &&
            number <= 8
        ) {

            selectBlock(
                BLOCK_TYPES[
                    number - 1
                ]
            );
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

        if (
            !inventoryOpen
        ) {

            renderer.domElement.requestPointerLock();
        }
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

        if (
            inventoryOpen
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

function playerCollides(
    x,
    feetY,
    z
) {

    const halfW =
        PLAYER_WIDTH / 2;

    const halfD =
        PLAYER_DEPTH / 2;

    const minX =
        Math.floor(
            x - halfW
        );

    const maxX =
        Math.floor(
            x + halfW
        );

    const minY =
        Math.floor(
            feetY + 0.001
        );

    const maxY =
        Math.floor(
            feetY +
            PLAYER_HEIGHT -
            0.001
        );

    const minZ =
        Math.floor(
            z - halfD
        );

    const maxZ =
        Math.floor(
            z + halfD
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

// ============================================================
// GROUND COLLISION
// ============================================================

function getColumnTop(
    x,
    z
) {

    for (
        let y = 15;
        y >= -4;
        y--
    ) {

        if (
            getBlock(
                x,
                y,
                z
            )
        ) {

            return y + 0.5;
        }
    }

    return -Infinity;
}

function getHighestGround(
    x,
    z
) {

    const halfW =
        PLAYER_WIDTH / 2;

    const halfD =
        PLAYER_DEPTH / 2;

    const minX =
        Math.floor(
            x - halfW
        );

    const maxX =
        Math.floor(
            x + halfW
        );

    const minZ =
        Math.floor(
            z - halfD
        );

    const maxZ =
        Math.floor(
            z + halfD
        );

    let highest =
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

            const top =
                getColumnTop(
                    bx,
                    bz
                );

            if (
                top > highest
            ) {
                highest = top;
            }
        }
    }

    return highest;
}

// ============================================================
// MOVEMENT
// ============================================================

const forwardVector =
    new THREE.Vector3();

const rightVector =
    new THREE.Vector3();

function movePlayer(
    delta
) {

    if (
        inventoryOpen
    ) {
        return;
    }

    let forward = 0;
    let right = 0;

    if (keys.w) {
        forward += 1;
    }

    if (keys.s) {
        forward -= 1;
    }

    if (keys.a) {
        right -= 1;
    }

    if (keys.d) {
        right += 1;
    }

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

    camera.getWorldDirection(
        forwardVector
    );

    forwardVector.y = 0;

    if (
        forwardVector.lengthSq() > 0
    ) {

        forwardVector.normalize();
    }

    rightVector.set(
        -forwardVector.z,
        0,
        forwardVector.x
    );

    const speed = 5;

    const distance =
        speed * delta;

    const dx =
        forwardVector.x *
        forward *
        distance +

        rightVector.x *
        right *
        distance;

    const dz =
        forwardVector.z *
        forward *
        distance +

        rightVector.z *
        right *
        distance;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    // X movement
    if (
        !playerCollides(
            camera.position.x + dx,
            feet,
            camera.position.z
        )
    ) {

        camera.position.x += dx;
    }

    // Z movement
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
// PHYSICS
// ============================================================

function updatePhysics(
    delta
) {

    if (
        inventoryOpen
    ) {
        return;
    }

    let feet =
        camera.position.y -
        EYE_HEIGHT;

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
    velocityY -=
        GRAVITY * delta;

    const movementY =
        velocityY * delta;

    const newFeet =
        feet + movementY;

    // Falling
    if (
        velocityY <= 0
    ) {

        const ground =
            getHighestGround(
                camera.position.x,
                camera.position.z
            );

        if (
            ground !== -Infinity &&
            newFeet <= ground &&
            feet >= ground - 0.2
        ) {

            feet = ground;

            velocityY = 0;

            grounded = true;
        }
        else {

            feet = newFeet;

            grounded = false;
        }
    }

    // Rising
    else {

        const newY =
            camera.position.y +
            movementY;

        if (
            !playerCollides(
                camera.position.x,
                newY - EYE_HEIGHT,
                camera.position.z
            )
        ) {

            feet = newY -
                EYE_HEIGHT;
        }
        else {

            velocityY = 0;
        }

        grounded = false;
    }

    camera.position.y =
        feet + EYE_HEIGHT;
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

function createSlot(
    type,
    index,
    parent
) {

    const slot =
        document.createElement("div");

    slot.style.width =
        "58px";

    slot.style.height =
        "58px";

    slot.style.background =
        "#444";

    slot.style.position =
        "relative";

    slot.style.boxSizing =
        "border-box";

    slot.style.cursor =
        "pointer";

    slot.style.userSelect =
        "none";

    const preview =
        document.createElement("div");

    preview.style.width =
        "36px";

    preview.style.height =
        "36px";

    preview.style.position =
        "absolute";

    preview.style.left =
        "9px";

    preview.style.top =
        "8px";

    preview.style.background =
        BLOCK_INFO[type].color;

    preview.style.border =
        "2px solid #111";

    slot.appendChild(
        preview
    );

    const number =
        document.createElement("div");

    number.textContent =
        String(index + 1);

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

    number.style.fontSize =
        "13px";

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

    slot.appendChild(
        count
    );

    slot.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            selectBlock(type);
        }
    );

    parent.appendChild(
        slot
    );

    return {
        slot: slot,
        count: count
    };
}

for (
    let i = 0;
    i < BLOCK_TYPES.length;
    i++
) {

    hotbarSlots.push(
        createSlot(
            BLOCK_TYPES[i],
            i,
            hotbar
        )
    );
}

function selectBlock(type) {

    if (
        inventory[type] <= 0
    ) {
        return;
    }

    selectedType = type;

    updateHotbar();

    updateInventory();
}

function updateHotbar() {

    for (
        let i = 0;
        i < BLOCK_TYPES.length;
        i++
    ) {

        const type =
            BLOCK_TYPES[i];

        const item =
            hotbarSlots[i];

        item.count.textContent =
            String(
                inventory[type]
            );

        if (
            type === selectedType
        ) {

            item.slot.style.border =
                "4px solid white";

            item.slot.style.boxShadow =
                "0 0 8px white";
        }
        else {

            item.slot.style.border =
                "3px solid #777";

            item.slot.style.boxShadow =
                "none";
        }
    }
}

updateHotbar();

// ============================================================
// INVENTORY
// ============================================================

const inventoryPanel =
    document.createElement("div");

inventoryPanel.style.position =
    "fixed";

inventoryPanel.style.left =
    "50%";

inventoryPanel.style.top =
    "50%";

inventoryPanel.style.transform =
    "translate(-50%, -50%)";

inventoryPanel.style.width =
    "520px";

inventoryPanel.style.padding =
    "20px";

inventoryPanel.style.background =
    "rgba(25,25,25,0.96)";

inventoryPanel.style.border =
    "4px solid #777";

inventoryPanel.style.borderRadius =
    "8px";

inventoryPanel.style.zIndex =
    "10000";

inventoryPanel.style.display =
    "none";

inventoryPanel.style.boxSizing =
    "border-box";

const inventoryTitle =
    document.createElement("div");

inventoryTitle.textContent =
    "Inventory";

inventoryTitle.style.color =
    "white";

inventoryTitle.style.fontSize =
    "24px";

inventoryTitle.style.fontWeight =
    "bold";

inventoryTitle.style.marginBottom =
    "15px";

inventoryTitle.style.textAlign =
    "center";

inventoryPanel.appendChild(
    inventoryTitle
);

const inventoryGrid =
    document.createElement("div");

inventoryGrid.style.display =
    "grid";

inventoryGrid.style.gridTemplateColumns =
    "repeat(4, 1fr)";

inventoryGrid.style.gap =
    "8px";

inventoryPanel.appendChild(
    inventoryGrid
);

const inventorySlots = [];

for (
    let i = 0;
    i < BLOCK_TYPES.length;
    i++
) {

    const type =
        BLOCK_TYPES[i];

    const item =
        createSlot(
            type,
            i,
            inventoryGrid
        );

    item.slot.style.width =
        "105px";

    item.slot.style.height =
        "75px";

    const label =
        document.createElement("div");

    label.textContent =
        type;

    label.style.position =
        "absolute";

    label.style.left =
        "45px";

    label.style.top =
        "8px";

    label.style.color =
        "white";

    label.style.fontSize =
        "13px";

    label.style.textTransform =
        "capitalize";

    item.slot.appendChild(
        label
    );

    inventorySlots.push(
        item
    );
}

const inventoryHint =
    document.createElement("div");

inventoryHint.textContent =
    "Press E to close";

inventoryHint.style.color =
    "#ccc";

inventoryHint.style.textAlign =
    "center";

inventoryHint.style.marginTop =
    "15px";

inventoryPanel.appendChild(
    inventoryHint
);

document.body.appendChild(
    inventoryPanel
);

function updateInventory() {

    for (
        let i = 0;
        i < BLOCK_TYPES.length;
        i++
    ) {

        const type =
            BLOCK_TYPES[i];

        inventorySlots[i]
            .count.textContent =
            String(
                inventory[type]
            );

        if (
            type === selectedType
        ) {

            inventorySlots[i]
                .slot.style.border =
                "4px solid white";
        }
        else {

            inventorySlots[i]
                .slot.style.border =
                "3px solid #777";
        }
    }
}

function toggleInventory() {

    inventoryOpen =
        !inventoryOpen;

    inventoryPanel.style.display =
        inventoryOpen
            ? "block"
            : "none";

    if (
        inventoryOpen
    ) {

        if (
            document.pointerLockElement ===
            renderer.domElement
        ) {

            document.exitPointerLock();
        }

        keys.w = false;
        keys.a = false;
        keys.s = false;
        keys.d = false;
        keys.space = false;

        updateInventory();
    }
}

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

let currentTarget =
    null;

const highlightGeometry =
    new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
            1.04,
            1.04,
            1.04
        )
    );

const highlight =
    new THREE.LineSegments(
        highlightGeometry,
        new THREE.LineBasicMaterial({
            color: 0xffffff
        })
    );

highlight.visible =
    false;

highlight.raycast =
    function() {};

scene.add(highlight);

function getTargetBlock() {

    if (
        inventoryOpen
    ) {
        return null;
    }

    raycaster.setFromCamera(
        center,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            meshTypeList,
            false
        );

    if (
        hits.length === 0
    ) {
        return null;
    }

    const hit =
        hits[0];

    const mesh =
        hit.object;

    const list =
        mesh.userData.blocks;

    const block =
        list[
            hit.instanceId
        ];

    if (
        !block
    ) {
        return null;
    }

    return {
        hit: hit,
        block: block
    };
}

let raycastTimer = 0;

function updateHighlight() {

    raycastTimer -=
        clockDelta;

    if (
        raycastTimer > 0
    ) {
        return;
    }

    raycastTimer =
        0.04;

    const target =
        getTargetBlock();

    currentTarget =
        target;

    if (
        !target
    ) {

        highlight.visible =
            false;

        return;
    }

    highlight.position.set(
        target.block.x,
        target.block.y,
        target.block.z
    );

    highlight.visible =
        true;
}

// ============================================================
// BREAK BLOCK
// ============================================================

function breakBlock() {

    const target =
        getTargetBlock();

    if (
        !target
    ) {
        return;
    }

    const block =
        target.block;

    // Protect bottom layer.
    if (
        block.y <= -4
    ) {
        return;
    }

    inventory[
        block.type
    ] += 1;

    deleteBlock(
        block.x,
        block.y,
        block.z
    );

    rebuildWorldMeshes();

    updateHotbar();

    updateInventory();
}

// ============================================================
// PLACE BLOCK
// ============================================================

function placeBlock() {

    const target =
        getTargetBlock();

    if (
        !target
    ) {
        return;
    }

    if (
        inventory[selectedType] <= 0
    ) {
        return;
    }

    const block =
        target.block;

    const normal =
        target.hit.face.normal;

    const x =
        block.x +
        Math.round(normal.x);

    const y =
        block.y +
        Math.round(normal.y);

    const z =
        block.z +
        Math.round(normal.z);

    if (
        getBlock(
            x,
            y,
            z
        )
    ) {
        return;
    }

    // Player collision check.
    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const head =
        feet +
        PLAYER_HEIGHT;

    const blockMinX =
        x - 0.5;

    const blockMaxX =
        x + 0.5;

    const blockMinY =
        y - 0.5;

    const blockMaxY =
        y + 0.5;

    const blockMinZ =
        z - 0.5;

    const blockMaxZ =
        z + 0.5;

    const playerMinX =
        camera.position.x -
        PLAYER_WIDTH / 2;

    const playerMaxX =
        camera.position.x +
        PLAYER_WIDTH / 2;

    const playerMinZ =
        camera.position.z -
        PLAYER_DEPTH / 2;

    const playerMaxZ =
        camera.position.z +
        PLAYER_DEPTH / 2;

    const overlaps =
        blockMaxX > playerMinX &&
        blockMinX < playerMaxX &&
        blockMaxY > feet &&
        blockMinY < head &&
        blockMaxZ > playerMinZ &&
        blockMinZ < playerMaxZ;

    if (
        overlaps
    ) {
        return;
    }

    setBlock(
        x,
        y,
        z,
        selectedType,
        "placed"
    );

    inventory[selectedType] -=
        1;

    rebuildWorldMeshes();

    updateHotbar();

    updateInventory();
}

// ============================================================
// MOUSE BUTTONS
// ============================================================

renderer.domElement.addEventListener(
    "mousedown",
    function(event) {

        if (
            inventoryOpen
        ) {
            return;
        }

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

let lastTime =
    performance.now();

let clockDelta = 0;

function animate(now) {

    requestAnimationFrame(
        animate
    );

    clockDelta =
        Math.min(
            (now - lastTime) /
            1000,
            0.05
        );

    lastTime =
        now;

    movePlayer(
        clockDelta
    );

    updatePhysics(
        clockDelta
    );

    updateHighlight();

    renderer.render(
        scene,
        camera
    );
}

requestAnimationFrame(
    animate
);

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
