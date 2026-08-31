import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ============================================================
// MINTCRAFT
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
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// ============================================================
// LIGHTING
// ============================================================

const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(30, 50, 20);
scene.add(sun);

const ambient =
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.5
    );

scene.add(ambient);

// ============================================================
// BLOCK MATERIALS
// ============================================================

const grass = new THREE.MeshLambertMaterial({
    color: 0x55aa33
});

const dirt = new THREE.MeshLambertMaterial({
    color: 0x8b5a2b
});

const stone = new THREE.MeshLambertMaterial({
    color: 0x777777
});

const wood = new THREE.MeshLambertMaterial({
    color: 0x6b421f
});

const leaves = new THREE.MeshLambertMaterial({
    color: 0x2f8f35,
    transparent: true,
    opacity: 0.9
});

// ============================================================
// BLOCK TYPES
// ============================================================

const BLOCKS = {
    grass: {
        material: grass,
        color: "#55aa33"
    },

    dirt: {
        material: dirt,
        color: "#8b5a2b"
    },

    stone: {
        material: stone,
        color: "#777777"
    },

    wood: {
        material: wood,
        color: "#6b421f"
    },

    leaves: {
        material: leaves,
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

function addBlock(
    x,
    y,
    z,
    type,
    category = "placed"
) {

    // Don't create duplicate blocks
    if (getBlock(x, y, z)) {
        return null;
    }

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            1,
            1,
            1
        ),
        BLOCKS[type].material
    );

    mesh.position.set(
        x,
        y,
        z
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

    block.geometry.dispose();
}

// ============================================================
// WORLD SEED
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
// TERRAIN HEIGHT
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

// ============================================================
// GENERATE TERRAIN
// ============================================================

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
// TREE SYSTEM
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

    // Four-block trunk
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
                Math.abs(dz) <= 3
            ) {

                // Don't cover the trunk
                if (
                    dx === 0 &&
                    dz === 0
                ) {
                    continue;
                }

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

// Generate trees
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

        // Keep spawn area clear
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

const PLAYER_WIDTH = 0.6;
const PLAYER_DEPTH = 0.6;
const PLAYER_HEIGHT = 1.8;

const EYE_HEIGHT = 1.62;

camera.position.set(
    0,
    terrainHeights.get("0,5") +
        0.5 +
        EYE_HEIGHT,
    5
);

let velocityY = 0;

const GRAVITY = 0.015;
const JUMP_POWER = 0.28;

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

        // Block selection
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
            event.code === "Space" ||
            event.code.startsWith("Arrow")
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
// PLAYER COLLISION
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
            feetY + 0.05
        );

    const maxY =
        Math.floor(
            feetY +
            PLAYER_HEIGHT -
            0.05
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
        let x2 = minX;
        x2 <= maxX;
        x2++
    ) {

        for (
            let y2 = minY;
            y2 <= maxY;
            y2++
        ) {

            for (
                let z2 = minZ;
                z2 <= maxZ;
                z2++
            ) {

                if (
                    getBlock(
                        x2,
                        y2,
                        z2
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

    const speed = 0.10;

    let forward = 0;
    let sideways = 0;

    // W = forward
    if (keys.w) {
        forward += speed;
    }

    // S = backward
    if (keys.s) {
        forward -= speed;
    }

    // A = left
    if (keys.a) {
        sideways -= speed;
    }

    // D = right
    if (keys.d) {
        sideways += speed;
    }

    // Prevent faster diagonal movement
    const length =
        Math.sqrt(
            forward * forward +
            sideways * sideways
        );

    if (
        length > speed
    ) {

        forward =
            forward / length *
            speed;

        sideways =
            sideways / length *
            speed;
    }

    // Camera-relative movement
    const dx =
        Math.sin(yaw) *
            forward +
        Math.cos(yaw) *
            sideways;

    const dz =
        Math.cos(yaw) *
            forward -
        Math.sin(yaw) *
            sideways;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    // X collision
    if (
        !playerCollides(
            camera.position.x + dx,
            feet,
            camera.position.z
        )
    ) {

        camera.position.x += dx;
    }

    // Z collision
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
// TERRAIN GROUND
// ============================================================

function getGroundHeight(
    x,
    z
) {

    const gx =
        Math.floor(x);

    const gz =
        Math.floor(z);

    const height =
        terrainHeights.get(
            `${gx},${gz}`
        );

    if (
        height === undefined
    ) {

        return -4.5;
    }

    // Top of terrain block
    return height - 0.5;
}

// ============================================================
// PHYSICS
// ============================================================

function updatePhysics() {

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    const ground =
        getGroundHeight(
            camera.position.x,
            camera.position.z
        );

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
        newFeet <= ground &&
        velocityY <= 0
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

const hotbarTypes = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves"
];

for (
    let i = 0;
    i < hotbarTypes.length;
    i++
) {

    const type =
        hotbarTypes[i];

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

    const block =
        document.createElement("div");

    block.style.width =
        "35px";

    block.style.height =
        "35px";

    block.style.position =
        "absolute";

    block.style.left =
        "8px";

    block.style.top =
        "8px";

    block.style.background =
        BLOCKS[type].color;

    block.style.border =
        "2px solid #111";

    slot.appendChild(
        block
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

    number.style.fontSize =
        "13px";

    slot.appendChild(
        number
    );

    slot.addEventListener(
        "click",
        function(event) {

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

        const type =
            hotbarTypes[i];

        if (
            type === selectedType
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
    new THREE.Vector2(
        0,
        0
    );

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
// BLOCK HIGHLIGHT
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
                    1.04,
                    1.04,
                    1.04
                )
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

// ============================================================
// BREAK BLOCK
// ============================================================

function breakBlock() {

    const hit =
        getTargetBlock();

    if (!hit) {
        return;
    }

    // Don't break the bottom-most layer
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

    if (!hit) {
        return;
    }

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
    const playerFeet =
        camera.position.y -
        EYE_HEIGHT;

    const playerHead =
        playerFeet +
        PLAYER_HEIGHT;

    const overlapsX =
        Math.abs(
            position.x -
            camera.position.x
        ) <
        0.8;

    const overlapsZ =
        Math.abs(
            position.z -
            camera.position.z
        ) <
        0.8;

    const overlapsY =
        position.y + 0.5 >
            playerFeet &&
        position.y - 0.5 <
            playerHead;

    if (
        overlapsX &&
        overlapsZ &&
        overlapsY
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

    addBlock(
        position.x,
        position.y,
        position.z,
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
// WINDOW RESIZE
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
