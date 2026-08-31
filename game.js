import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

// ===============================
// MINTCRAFT
// ===============================

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
document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

// ===============================
// LIGHTING
// ===============================

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(30, 40, 20);
scene.add(sun);

scene.add(
    new THREE.HemisphereLight(
        0xffffff,
        0x555555,
        1.5
    )
);

// ===============================
// MATERIALS
// ===============================

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
    color: 0x2f8f35
});

let selectedBlock = grass;

// ===============================
// BLOCKS
// ===============================

const blocks = [];

const blockMap = new Map();

function key(x, y, z) {
    return `${x},${y},${z}`;
}

function addBlock(x, y, z, material) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        material
    );

    mesh.position.set(x, y, z);

    mesh.userData.x = x;
    mesh.userData.y = y;
    mesh.userData.z = z;

    scene.add(mesh);

    blocks.push(mesh);

    blockMap.set(
        key(x, y, z),
        mesh
    );

    return mesh;
}

function getBlock(x, y, z) {

    return blockMap.get(
        key(
            Math.floor(x),
            Math.floor(y),
            Math.floor(z)
        )
    );
}

function deleteBlock(block) {

    scene.remove(block);

    const index =
        blocks.indexOf(block);

    if (index >= 0) {
        blocks.splice(index, 1);
    }

    blockMap.delete(
        key(
            block.userData.x,
            block.userData.y,
            block.userData.z
        )
    );
}

// ===============================
// WORLD SEED
// ===============================

const seed =
    Math.floor(Math.random() * 999999999);

console.log("World Seed:", seed);

function noise(x, z) {

    const n =
        Math.sin(
            x * 127.1 +
            z * 311.7 +
            seed
        ) * 43758.5453;

    return n - Math.floor(n);
}

// ===============================
// TERRAIN
// ===============================

function terrainHeight(x, z) {

    const h =
        5 +
        Math.sin(
            (x + seed) * 0.10
        ) * 3 +
        Math.cos(
            (z - seed) * 0.10
        ) * 3 +
        Math.sin(
            (x + z) * 0.18
        );

    return Math.max(
        1,
        Math.min(
            10,
            Math.round(h)
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

        const h =
            terrainHeight(x, z);

        for (
            let y = -4;
            y < h;
            y++
        ) {

            let material;

            if (y === h - 1) {
                material = grass;
            }
            else if (y >= h - 4) {
                material = dirt;
            }
            else {
                material = stone;
            }

            addBlock(
                x,
                y,
                z,
                material
            );
        }

        // Trees
        if (
            noise(x, z) > 0.975 &&
            Math.abs(x) > 3 &&
            Math.abs(z) > 3
        ) {

            for (let y = 0; y < 4; y++) {

                addBlock(
                    x,
                    h + y,
                    z,
                    wood
                );
            }

            for (
                let lx = -2;
                lx <= 2;
                lx++
            ) {

                for (
                    let lz = -2;
                    lz <= 2;
                    lz++
                ) {

                    if (
                        Math.abs(lx) +
                        Math.abs(lz) <= 3
                    ) {

                        addBlock(
                            x + lx,
                            h + 3,
                            z + lz,
                            leaves
                        );
                    }
                }
            }
        }
    }
}

// ===============================
// PLAYER
// ===============================

camera.position.set(
    0,
    terrainHeight(0, 5) + 2,
    5
);

let velocityY = 0;

const gravity = 0.015;
const jumpStrength = 0.28;

let canJump = false;

// ===============================
// KEYBOARD
// ===============================

const keys = {
    W: false,
    A: false,
    S: false,
    D: false,
    SPACE: false
};

document.addEventListener(
    "keydown",
    function(event) {

        if (event.code === "KeyW")
            keys.W = true;

        if (event.code === "KeyA")
            keys.A = true;

        if (event.code === "KeyS")
            keys.S = true;

        if (event.code === "KeyD")
            keys.D = true;

        if (event.code === "Space")
            keys.SPACE = true;

        if (event.code === "Digit1")
            selectedBlock = grass;

        if (event.code === "Digit2")
            selectedBlock = dirt;

        if (event.code === "Digit3")
            selectedBlock = stone;

        if (event.code === "Digit4")
            selectedBlock = wood;

        if (event.code === "Digit5")
            selectedBlock = leaves;

    }
);

document.addEventListener(
    "keyup",
    function(event) {

        if (event.code === "KeyW")
            keys.W = false;

        if (event.code === "KeyA")
            keys.A = false;

        if (event.code === "KeyS")
            keys.S = false;

        if (event.code === "KeyD")
            keys.D = false;

        if (event.code === "Space")
            keys.SPACE = false;

    }
);

// ===============================
// MOUSE LOOK
// ===============================

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
            event.movementX * 0.002;

        pitch -=
            event.movementY * 0.002;

        pitch = Math.max(
            -1.5,
            Math.min(1.5, pitch)
        );

        camera.rotation.order =
            "YXZ";

        camera.rotation.y =
            yaw;

        camera.rotation.x =
            pitch;

    }
);

// ===============================
// SIMPLE MOVEMENT
// ===============================

function movePlayer() {

    const speed = 0.10;

    let forward = 0;
    let sideways = 0;

    if (keys.W)
        forward += speed;

    if (keys.S)
        forward -= speed;

    if (keys.A)
        sideways -= speed;

    if (keys.D)
        sideways += speed;

    const dx =
        Math.sin(yaw) * forward +
        Math.cos(yaw) * sideways;

    const dz =
        Math.cos(yaw) * forward -
        Math.sin(yaw) * sideways;

    camera.position.x += dx;
    camera.position.z += dz;
}

// ===============================
// GRAVITY + GROUND
// ===============================

function physics() {

    const x =
        Math.floor(camera.position.x);

    const z =
        Math.floor(camera.position.z);

    let ground = -5;

    // Find highest block below player
    for (
        let y = 15;
        y >= -5;
        y--
    ) {

        if (
            getBlock(x, y, z)
        ) {

            ground =
                y + 0.5;

            break;
        }
    }

    const playerFeet =
        camera.position.y - 1.6;

    // Gravity
    if (
        playerFeet > ground
    ) {

        velocityY -= gravity;

        camera.position.y +=
            velocityY;

        canJump = false;

    }
    else {

        camera.position.y =
            ground + 1.6;

        velocityY = 0;

        canJump = true;

    }

    // Jump
    if (
        keys.SPACE &&
        canJump
    ) {

        velocityY =
            jumpStrength;

        canJump = false;

        keys.SPACE = false;

    }
}

// ===============================
// CROSSHAIR
// ===============================

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
    "30px";

crosshair.style.fontWeight =
    "bold";

crosshair.style.textShadow =
    "2px 2px black";

crosshair.style.pointerEvents =
    "none";

crosshair.style.zIndex =
    "100";

document.body.appendChild(
    crosshair
);

// ===============================
// BLOCK HIGHLIGHT
// ===============================

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

        highlight =
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

        scene.add(highlight);
    }

    highlight.position.copy(
        block.position
    );
}

// ===============================
// BREAK / PLACE
// ===============================

function targetBlock() {

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
    )
        return null;

    if (
        hits[0].distance > 6
    )
        return null;

    return hits[0];
}

renderer.domElement.addEventListener(
    "mousedown",
    function(event) {

        if (
            document.pointerLockElement !==
            renderer.domElement
        )
            return;

        const hit =
            targetBlock();

        if (!hit)
            return;

        // Left click = break
        if (event.button === 0) {

            deleteBlock(
                hit.object
            );
        }

        // Right click = place
        if (event.button === 2) {

            const p =
                hit.object.position.clone();

            p.add(
                hit.face.normal
            );

            p.x =
                Math.round(p.x);

            p.y =
                Math.round(p.y);

            p.z =
                Math.round(p.z);

            if (
                !getBlock(
                    p.x,
                    p.y,
                    p.z
                )
            ) {

                addBlock(
                    p.x,
                    p.y,
                    p.z,
                    selectedBlock
                );
            }
        }
    }
);

renderer.domElement.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);

// ===============================
// GAME LOOP
// ===============================

function gameLoop() {

    requestAnimationFrame(
        gameLoop
    );

    movePlayer();

    physics();

    updateHighlight();

    renderer.render(
        scene,
        camera
    );
}

gameLoop();

// ===============================
// RESIZE
// ===============================

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
