import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ============================================================
// MINTCRAFT
// Full optimized version with fixed movement + collision
// ============================================================

// ============================================================
// SCENE
// ============================================================

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

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
);

document.body.style.margin = "0";
document.body.style.overflow = "hidden";

document.body.appendChild(
    renderer.domElement
);

// ============================================================
// LIGHTING
// ============================================================

const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(
    30,
    50,
    20
);

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

const textureLoader =
    new THREE.TextureLoader();

function loadTexture(filename) {

    const texture =
        textureLoader.load(
            "textures/" + filename
        );

    texture.magFilter =
        THREE.NearestFilter;

    texture.minFilter =
        THREE.NearestFilter;

    texture.colorSpace =
        THREE.SRGBColorSpace;

    return texture;
}

const textures = {

    grassTop:
        loadTexture("grass_top.png"),

    grassSide:
        loadTexture("grass_side.png"),

    dirt:
        loadTexture("dirt.png"),

    stone:
        loadTexture("stone.png"),

    woodSide:
        loadTexture("wood_side.png"),

    woodTop:
        loadTexture("wood_top.png"),

    leaves:
        loadTexture("leaves.png"),

    planks:
        loadTexture("planks.png"),

    glass:
        loadTexture("glass.png"),

    bricks:
        loadTexture("bricks.png")
};

// ============================================================
// MATERIALS
// ============================================================

function normalMaterial(texture) {

    return new THREE.MeshLambertMaterial({
        map: texture
    });
}

const grassSideMaterial =
    normalMaterial(
        textures.grassSide
    );

const grassTopMaterial =
    normalMaterial(
        textures.grassTop
    );

const dirtMaterial =
    normalMaterial(
        textures.dirt
    );

const stoneMaterial =
    normalMaterial(
        textures.stone
    );

const woodSideMaterial =
    normalMaterial(
        textures.woodSide
    );

const woodTopMaterial =
    normalMaterial(
        textures.woodTop
    );

const leavesMaterial =
    new THREE.MeshLambertMaterial({

        map: textures.leaves,

        transparent: true,

        opacity: 0.9,

        alphaTest: 0.05,

        depthWrite: false
    });

const planksMaterial =
    normalMaterial(
        textures.planks
    );

const glassMaterial =
    new THREE.MeshLambertMaterial({

        map: textures.glass,

        transparent: true,

        opacity: 0.45,

        depthWrite: false
    });

const bricksMaterial =
    normalMaterial(
        textures.bricks
    );

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
// WORLD DATA
// ============================================================

const blocks = new Map();

const terrain = new Map();

function makeKey(x, y, z) {

    return (
        Math.floor(x) +
        "," +
        Math.floor(y) +
        "," +
        Math.floor(z)
    );
}

function getBlock(x, y, z) {

    return blocks.get(
        makeKey(x, y, z)
    );
}

function addBlock(
    x,
    y,
    z,
    type,
    category
) {

    const key =
        makeKey(x, y, z);

    if (
        blocks.has(key)
    ) {

        return false;
    }

    blocks.set(
        key,
        {

            x: Math.floor(x),

            y: Math.floor(y),

            z: Math.floor(z),

            type: type,

            category:
                category || "placed"

        }
    );

    return true;
}

function removeBlock(
    x,
    y,
    z
) {

    blocks.delete(
        makeKey(x, y, z)
    );
}

// ============================================================
// WORLD GENERATION
// ============================================================

const seed =
    Math.floor(
        Math.random() *
        1000000000
    );

console.log(
    "MintCraft World Seed:",
    seed
);

function noise(x, z) {

    const value =
        Math.sin(
            x * 127.1 +
            z * 311.7 +
            seed
        ) *
        43758.5453123;

    return (
        value -
        Math.floor(value)
    );
}

function getTerrainHeight(
    x,
    z
) {

    const a =
        Math.sin(
            (x +
                seed *
                0.00001) *
            0.11
        ) * 2.5;

    const b =
        Math.cos(
            (z -
                seed *
                0.00001) *
            0.12
        ) * 2.5;

    const c =
        Math.sin(
            (x +
                z +
                seed *
                0.00002) *
            0.20
        ) * 1.2;

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(
                5 +
                a +
                b +
                c
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
            getTerrainHeight(
                x,
                z
            );

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

function treeNearby(
    x,
    z
) {

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

            const h =
                terrain.get(
                    (x + dx) +
                    "," +
                    (z + dz)
                );

            if (
                h === undefined
            ) {

                continue;
            }

            const block =
                getBlock(
                    x + dx,
                    h,
                    z + dz
                );

            if (
                block &&
                block.category ===
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
            terrain.get(
                x + "," + z
            );

        if (
            ground === undefined
        ) {

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

// ============================================================
// INSTANCED RENDERING
// ============================================================

const worldGroup =
    new THREE.Group();

scene.add(
    worldGroup
);

const meshes = {};

const raycastMeshes = [];

const dummy =
    new THREE.Object3D();

function rebuildWorld() {

    while (
        worldGroup.children.length > 0
    ) {

        const mesh =
            worldGroup.children[0];

        worldGroup.remove(
            mesh
        );

        if (
            mesh.geometry
        ) {

            mesh.geometry.dispose();
        }
    }

    for (
        const type of BLOCK_TYPES
    ) {

        delete meshes[type];
    }

    raycastMeshes.length = 0;

    const groups = {};

    for (
        const block of blocks.values()
    ) {

        if (
            !groups[block.type]
        ) {

            groups[block.type] = [];
        }

        groups[block.type].push(
            block
        );
    }

    for (
        const type of BLOCK_TYPES
    ) {

        const list =
            groups[type] || [];

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

        mesh.userData.blocks =
            list;

        mesh.userData.blockType =
            type;

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

        worldGroup.add(
            mesh
        );

        meshes[type] =
            mesh;

        raycastMeshes.push(
            mesh
        );
    }
}

rebuildWorld();

// ============================================================
// PLAYER
// ============================================================

const PLAYER_WIDTH = 0.6;

const PLAYER_DEPTH = 0.6;

const PLAYER_HEIGHT = 1.8;

const EYE_HEIGHT = 1.62;

const spawnGround =
    terrain.get("0,5") || 5;

camera.position.set(
    0,
    spawnGround +
        EYE_HEIGHT +
        0.01,
    5
);

let velocityY = 0;

let grounded = false;

const GRAVITY = 18;

const JUMP_POWER = 7;

const MOVE_SPEED = 5;

// ============================================================
// INPUT
// ============================================================

const keys = {

    w: false,

    a: false,

    s: false,

    d: false,

    space: false

};

// ============================================================
// PLAYER COLLISION
// ============================================================

// Checks horizontal collision only.
// IMPORTANT: the bottom and top edges use a tiny
// margin so standing on a block does NOT count
// as being inside that block.

function horizontalCollision(
    x,
    feet,
    z
) {

    const halfWidth =
        PLAYER_WIDTH / 2;

    const halfDepth =
        PLAYER_DEPTH / 2;

    const minX =
        Math.floor(
            x - halfWidth + 0.001
        );

    const maxX =
        Math.floor(
            x + halfWidth - 0.001
        );

    const minY =
        Math.floor(
            feet + 0.05
        );

    const maxY =
        Math.floor(
            feet +
            PLAYER_HEIGHT -
            0.05
        );

    const minZ =
        Math.floor(
            z - halfDepth + 0.001
        );

    const maxZ =
        Math.floor(
            z + halfDepth - 0.001
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
// FIND GROUND DIRECTLY UNDER PLAYER
// ============================================================

function findGroundBelow(
    x,
    feet,
    z
) {

    const halfWidth =
        PLAYER_WIDTH / 2;

    const halfDepth =
        PLAYER_DEPTH / 2;

    const minX =
        Math.floor(
            x - halfWidth + 0.001
        );

    const maxX =
        Math.floor(
            x + halfWidth - 0.001
        );

    const minZ =
        Math.floor(
            z - halfDepth + 0.001
        );

    const maxZ =
        Math.floor(
            z + halfDepth - 0.001
        );

    let bestTop =
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

            // Search only a small area below player.
            const startY =
                Math.floor(
                    feet + 0.25
                );

            const endY =
                Math.floor(
                    feet - 0.35
                );

            for (
                let by = startY;
                by >= endY;
                by--
            ) {

                const block =
                    getBlock(
                        bx,
                        by,
                        bz
                    );

                if (
                    block
                ) {

                    const top =
                        block.y + 0.5;

                    if (
                        top <= feet + 0.08 &&
                        top > bestTop
                    ) {

                        bestTop =
                            top;
                    }

                    break;
                }
            }
        }
    }

    return bestTop;
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
        Math.sqrt(
            forward * forward +
            right * right
        );

    forward /=
        length;

    right /=
        length;

    // Forward direction based on camera yaw.
    forwardVector.set(
        0,
        0,
        -1
    );

    forwardVector.applyQuaternion(
        camera.quaternion
    );

    forwardVector.y = 0;

    if (
        forwardVector.lengthSq() >
        0.0001
    ) {

        forwardVector.normalize();
    }

    rightVector.set(
        forwardVector.z,
        0,
        -forwardVector.x
    );

    const distance =
        MOVE_SPEED * delta;

    const moveX =
        (
            forwardVector.x *
            forward
        +
            rightVector.x *
            right
        ) *
        distance;

    const moveZ =
        (
            forwardVector.z *
            forward
        +
            rightVector.z *
            right
        ) *
        distance;

    const feet =
        camera.position.y -
        EYE_HEIGHT;

    // Move X
    if (
        !horizontalCollision(
            camera.position.x + moveX,
            feet,
            camera.position.z
        )
    ) {

        camera.position.x +=
            moveX;
    }

    // Move Z
    if (
        !horizontalCollision(
            camera.position.x,
            feet,
            camera.position.z + moveZ
        )
    ) {

        camera.position.z +=
            moveZ;
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

    // --------------------------------------------------------
    // JUMP
    // --------------------------------------------------------

    if (
        keys.space &&
        grounded
    ) {

        velocityY =
            JUMP_POWER;

        grounded =
            false;

        keys.space =
            false;
    }

    // --------------------------------------------------------
    // GRAVITY
    // --------------------------------------------------------

    velocityY -=
        GRAVITY * delta;

    // Limit falling speed.
    if (
        velocityY < -30
    ) {

        velocityY = -30;
    }

    const oldFeet =
        feet;

    const newFeet =
        feet +
        velocityY * delta;

    // --------------------------------------------------------
    // FALLING
    // --------------------------------------------------------

    if (
        velocityY <= 0
    ) {

        const ground =
            findGroundBelow(
                camera.position.x,
                feet,
                camera.position.z
            );

        if (
            ground !== -Infinity &&
            newFeet <= ground &&
            oldFeet >= ground - 0.4
        ) {

            feet =
                ground;

            velocityY =
                0;

            grounded =
                true;

        }
        else {

            feet =
                newFeet;

            grounded =
                false;
        }
    }

    // --------------------------------------------------------
    // MOVING UP
    // --------------------------------------------------------

    else {

        const testFeet =
            newFeet;

        const testHead =
            testFeet +
            PLAYER_HEIGHT;

        const oldHead =
            feet +
            PLAYER_HEIGHT;

        let hitHead =
            false;

        const halfWidth =
            PLAYER_WIDTH / 2;

        const halfDepth =
            PLAYER_DEPTH / 2;

        const minX =
            Math.floor(
                camera.position.x -
                halfWidth +
                0.001
            );

        const maxX =
            Math.floor(
                camera.position.x +
                halfWidth -
                0.001
            );

        const minZ =
            Math.floor(
                camera.position.z -
                halfDepth +
                0.001
            );

        const maxZ =
            Math.floor(
                camera.position.z +
                halfDepth -
                0.001
            );

        const minY =
            Math.floor(
                oldHead +
                0.001
            );

        const maxY =
            Math.floor(
                testHead +
                0.001
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

                    const block =
                        getBlock(
                            bx,
                            by,
                            bz
                        );

                    if (
                        block &&
                        block.y - 0.5 <
                            testHead &&
                        block.y + 0.5 >
                            oldHead
                    ) {

                        hitHead =
                            true;
                    }
                }
            }
        }

        if (
            hitHead
        ) {

            velocityY =
                0;

        }
        else {

            feet =
                testFeet;
        }

        grounded =
            false;
    }

    camera.position.y =
        feet +
        EYE_HEIGHT;
}

// ============================================================
// CROSSHAIR
// ============================================================

const crosshair =
    document.createElement(
        "div"
    );

crosshair.textContent =
    "+";

Object.assign(
    crosshair.style,
    {

        position: "fixed",

        left: "50%",

        top: "50%",

        transform:
            "translate(-50%,-50%)",

        color: "white",

        fontSize: "28px",

        fontWeight: "bold",

        fontFamily: "Arial",

        textShadow:
            "2px 2px 2px black",

        pointerEvents:
            "none",

        zIndex: "9999"

    }
);

document.body.appendChild(
    crosshair
);

// ============================================================
// HOTBAR
// ============================================================

const hotbar =
    document.createElement(
        "div"
    );

Object.assign(
    hotbar.style,
    {

        position: "fixed",

        left: "50%",

        bottom: "20px",

        transform:
            "translateX(-50%)",

        display: "flex",

        gap: "5px",

        padding: "7px",

        background:
            "rgba(20,20,20,0.85)",

        border:
            "3px solid #777",

        borderRadius: "5px",

        zIndex: "9999"

    }
);

document.body.appendChild(
    hotbar
);

const hotbarSlots = [];

function makeSlot(
    type,
    index,
    parent
) {

    const slot =
        document.createElement(
            "div"
        );

    Object.assign(
        slot.style,
        {

            width: "58px",

            height: "58px",

            background: "#444",

            position: "relative",

            boxSizing:
                "border-box",

            cursor: "pointer",

            userSelect: "none"

        }
    );

    const preview =
        document.createElement(
            "div"
        );

    Object.assign(
        preview.style,
        {

            width: "36px",

            height: "36px",

            position: "absolute",

            left: "9px",

            top: "8px",

            background:
                BLOCK_INFO[type].color,

            border:
                "2px solid #111"

        }
    );

    slot.appendChild(
        preview
    );

    const number =
        document.createElement(
            "div"
        );

    number.textContent =
        index + 1;

    Object.assign(
        number.style,
        {

            position: "absolute",

            left: "3px",

            bottom: "2px",

            color: "white",

            fontWeight: "bold",

            fontSize: "13px"

        }
    );

    slot.appendChild(
        number
    );

    const count =
        document.createElement(
            "div"
        );

    Object.assign(
        count.style,
        {

            position: "absolute",

            right: "4px",

            bottom: "2px",

            color: "white",

            fontWeight: "bold",

            fontSize: "14px"

        }
    );

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
        makeSlot(
            BLOCK_TYPES[i],
            i,
            hotbar
        )
    );
}

function selectBlock(
    type
) {

    if (
        inventory[type] <= 0
    ) {

        return;
    }

    selectedType =
        type;

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

        const slot =
            hotbarSlots[i];

        slot.count.textContent =
            inventory[type];

        if (
            type === selectedType
        ) {

            slot.slot.style.border =
                "4px solid white";

            slot.slot.style.boxShadow =
                "0 0 8px white";

        }
        else {

            slot.slot.style.border =
                "3px solid #777";

            slot.slot.style.boxShadow =
                "none";
        }
    }
}

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

const inventoryPanel =
    document.createElement(
        "div"
    );

Object.assign(
    inventoryPanel.style,
    {

        position: "fixed",

        left: "50%",

        top: "50%",

        transform:
            "translate(-50%,-50%)",

        width: "520px",

        padding: "20px",

        background:
            "rgba(25,25,25,0.96)",

        border:
            "4px solid #777",

        borderRadius: "8px",

        zIndex: "10000",

        display: "none",

        boxSizing:
            "border-box"

    }
);

const inventoryTitle =
    document.createElement(
        "div"
    );

inventoryTitle.textContent =
    "Inventory";

Object.assign(
    inventoryTitle.style,
    {

        color: "white",

        fontSize: "24px",

        fontWeight: "bold",

        marginBottom: "15px",

        textAlign: "center"

    }
);

inventoryPanel.appendChild(
    inventoryTitle
);

const inventoryGrid =
    document.createElement(
        "div"
    );

Object.assign(
    inventoryGrid.style,
    {

        display: "grid",

        gridTemplateColumns:
            "repeat(4,1fr)",

        gap: "8px"

    }
);

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

    const slot =
        makeSlot(
            type,
            i,
            inventoryGrid
        );

    slot.slot.style.width =
        "105px";

    slot.slot.style.height =
        "75px";

    const label =
        document.createElement(
            "div"
        );

    label.textContent =
        type;

    Object.assign(
        label.style,
        {

            position: "absolute",

            left: "45px",

            top: "8px",

            color: "white",

            fontSize: "13px",

            textTransform:
                "capitalize"

        }
    );

    slot.slot.appendChild(
        label
    );

    inventorySlots.push(
        slot
    );
}

const inventoryHint =
    document.createElement(
        "div"
    );

inventoryHint.textContent =
    "Press E to close";

Object.assign(
    inventoryHint.style,
    {

        color: "#ccc",

        textAlign: "center",

        marginTop: "15px"

    }
);

inventoryPanel.appendChild(
    inventoryHint
);

document.body.appendChild(
    inventoryPanel
);

let inventoryOpen =
    false;

function updateInventory() {

    for (
        let i = 0;
        i < BLOCK_TYPES.length;
        i++
    ) {

        const type =
            BLOCK_TYPES[i];

        const slot =
            inventorySlots[i];

        slot.count.textContent =
            inventory[type];

        if (
            type === selectedType
        ) {

            slot.slot.style.border =
                "4px solid white";

        }
        else {

            slot.slot.style.border =
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

updateHotbar();

updateInventory();

// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code ===
            "KeyW"
        ) {

            keys.w = true;
        }

        if (
            event.code ===
            "KeyA"
        ) {

            keys.a = true;
        }

        if (
            event.code ===
            "KeyS"
        ) {

            keys.s = true;
        }

        if (
            event.code ===
            "KeyD"
        ) {

            keys.d = true;
        }

        if (
            event.code ===
            "Space"
        ) {

            keys.space = true;

            event.preventDefault();
        }

        if (
            event.code ===
            "KeyE"
        ) {

            if (
                !event.repeat
            ) {

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
            event.code ===
            "KeyW"
        ) {

            keys.w = false;
        }

        if (
            event.code ===
            "KeyA"
        ) {

            keys.a = false;
        }

        if (
            event.code ===
            "KeyS"
        ) {

            keys.s = false;
        }

        if (
            event.code ===
            "KeyD"
        ) {

            keys.d = false;
        }

        if (
            event.code ===
            "Space"
        ) {

            keys.space = false;
        }
    }
);

// ============================================================
// MOUSE LOOK
// ============================================================

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

        camera.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;
    }
);

let yaw = 0;

let pitch = 0;

// ============================================================
// BLOCK TARGETING
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

const outline =
    new THREE.LineSegments(

        new THREE.EdgesGeometry(
            new THREE.BoxGeometry(
                1.04,
                1.04,
                1.04
            )
        ),

        new THREE.LineBasicMaterial({
            color: 0xffffff
        })

    );

outline.visible =
    false;

outline.raycast =
    function() {};

scene.add(
    outline
);

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
            raycastMeshes,
            false
        );

    if (
        hits.length === 0
    ) {

        return null;
    }

    const hit =
        hits[0];

    const list =
        hit.object.userData.blocks;

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

let targetTimer = 0;

function updateHighlight(
    delta
) {

    targetTimer -=
        delta;

    if (
        targetTimer > 0
    ) {

        return;
    }

    targetTimer =
        0.05;

    currentTarget =
        getTargetBlock();

    if (
        currentTarget
    ) {

        outline.position.set(

            currentTarget.block.x,

            currentTarget.block.y,

            currentTarget.block.z

        );

        outline.visible =
            true;

    }
    else {

        outline.visible =
            false;
    }
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

    if (
        block.y <= -4
    ) {

        return;
    }

    inventory[
        block.type
    ]++;

    removeBlock(
        block.x,
        block.y,
        block.z
    );

    rebuildWorld();

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

    // Check if new block would overlap player
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

    addBlock(
        x,
        y,
        z,
        selectedType,
        "placed"
    );

    inventory[
        selectedType
    ]--;

    rebuildWorld();

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

function gameLoop(
    currentTime
) {

    requestAnimationFrame(
        gameLoop
    );

    const delta =
        Math.min(
            (currentTime -
                lastTime) /
            1000,
            0.05
        );

    lastTime =
        currentTime;

    movePlayer(
        delta
    );

    updatePhysics(
        delta
    );

    updateHighlight(
        delta
    );

    renderer.render(
        scene,
        camera
    );
}

requestAnimationFrame(
    gameLoop
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
