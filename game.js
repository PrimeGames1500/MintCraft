var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

var renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
document.body.appendChild(renderer.domElement);

var clock = new THREE.Clock();

var blockSize = 0.75;

var textureLoader = new THREE.TextureLoader();

var textures = {
    grassTop: textureLoader.load("./textures/grass_top.png"),
    grassSide: textureLoader.load("./textures/grass_side.png"),
    dirt: textureLoader.load("./textures/dirt.png"),
    stone: textureLoader.load("./textures/stone.png"),
    woodSide: textureLoader.load("./textures/wood_side.png"),
    woodTop: textureLoader.load("./textures/wood_top.png"),
    leaves: textureLoader.load("./textures/leaves.png"),
    planks: textureLoader.load("./textures/planks.png"),
    glass: textureLoader.load("./textures/glass.png"),
    bricks: textureLoader.load("./textures/bricks.png")
};

var blockTypes = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves",
    "planks",
    "glass",
    "bricks"
];

var inventory = {
    grass: 20,
    dirt: 20,
    stone: 20,
    wood: 10,
    leaves: 10,
    planks: 20,
    glass: 10,
    bricks: 20
};

var selectedType = "grass";
var inventoryOpen = false;

var blockMap = new Map();
var terrainHeights = new Map();

function blockKey(x, y, z) {
    return x + "," + y + "," + z;
}

function makeMaterial(texture, transparent) {
    return new THREE.MeshLambertMaterial({
        map: texture,
        transparent: transparent || false,
        opacity: transparent ? 0.55 : 1,
        depthWrite: transparent ? false : true
    });
}

var materials = {};

materials.grassTop = makeMaterial(textures.grassTop);
materials.grassSide = makeMaterial(textures.grassSide);
materials.dirt = makeMaterial(textures.dirt);
materials.stone = makeMaterial(textures.stone);
materials.woodSide = makeMaterial(textures.woodSide);
materials.woodTop = makeMaterial(textures.woodTop);
materials.leaves = makeMaterial(textures.leaves, true);
materials.planks = makeMaterial(textures.planks);
materials.glass = makeMaterial(textures.glass, true);
materials.bricks = makeMaterial(textures.bricks);

function grassMaterials() {
    return [
        materials.grassSide,
        materials.grassSide,
        materials.grassTop,
        materials.dirt,
        materials.grassSide,
        materials.grassSide
    ];
}

var geometries = {};

for (var i = 0; i < blockTypes.length; i++) {
    geometries[blockTypes[i]] = new THREE.BoxGeometry(
        blockSize,
        blockSize,
        blockSize
    );
}

var worldGroup = new THREE.Group();
scene.add(worldGroup);

var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

var sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
scene.add(sun);

var worldSize = 60;
var maxHeight = 12;

function getTerrainHeight(x, z) {
    var key = x + "," + z;

    if (terrainHeights.has(key)) {
        return terrainHeights.get(key);
    }

    var h =
        2 +
        Math.floor(
            Math.sin(x * 0.22) * 1.5 +
            Math.cos(z * 0.19) * 1.5 +
            Math.sin((x + z) * 0.08) * 2
        );

    if (h < 1) h = 1;
    if (h > maxHeight) h = maxHeight;

    terrainHeights.set(key, h);

    return h;
}

function addTreeData(x, y, z) {
    for (var i = 0; i < 4; i++) {
        blockMap.set(blockKey(x, y + i, z), "wood");
    }

    for (var dx = -2; dx <= 2; dx++) {
        for (var dy = 2; dy <= 4; dy++) {
            for (var dz = -2; dz <= 2; dz++) {
                var distance = Math.abs(dx) + Math.abs(dz);

                if (distance <= 2 || dy === 4) {
                    var key = blockKey(x + dx, y + dy, z + dz);

                    if (!blockMap.has(key)) {
                        blockMap.set(key, "leaves");
                    }
                }
            }
        }
    }
}

function generateWorldData() {
    blockMap.clear();
    terrainHeights.clear();

    for (var x = -worldSize; x <= worldSize; x++) {
        for (var z = -worldSize; z <= worldSize; z++) {

            var height = getTerrainHeight(x, z);

            for (var y = -4; y <= height; y++) {
                var type;

                if (y === height) {
                    type = "grass";
                } else if (y >= height - 3) {
                    type = "dirt";
                } else {
                    type = "stone";
                }

                blockMap.set(blockKey(x, y, z), type);
            }

            if (
                Math.abs(x) > 4 &&
                Math.abs(z) > 4 &&
                x % 11 === 0 &&
                z % 13 === 0
            ) {
                addTreeData(x, height + 1, z);
            }
        }
    }
}

function createMeshForType(type, positions) {
    if (positions.length === 0) {
        return null;
    }

    var geometry = geometries[type];
    var material;

    if (type === "grass") {
        material = grassMaterials();
    } else if (type === "wood") {
        material = [
            materials.woodSide,
            materials.woodSide,
            materials.woodTop,
            materials.woodTop,
            materials.woodSide,
            materials.woodSide
        ];
    } else {
        material = materials[type];
    }

    var mesh = new THREE.InstancedMesh(
        geometry,
        material,
        positions.length
    );

    mesh.userData.blockType = type;

    var dummy = new THREE.Object3D();

    for (var i = 0; i < positions.length; i++) {
        dummy.position.set(
            positions[i].x * blockSize,
            positions[i].y * blockSize,
            positions[i].z * blockSize
        );

        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    return mesh;
}

function rebuildWorld() {
    while (worldGroup.children.length > 0) {
        worldGroup.remove(worldGroup.children[0]);
    }

    var grouped = {};

    for (var i = 0; i < blockTypes.length; i++) {
        grouped[blockTypes[i]] = [];
    }

    blockMap.forEach(function(type, key) {
        var parts = key.split(",");

        grouped[type].push({
            x: Number(parts[0]),
            y: Number(parts[1]),
            z: Number(parts[2])
        });
    });

    for (var i = 0; i < blockTypes.length; i++) {
        var type = blockTypes[i];

        var mesh = createMeshForType(
            type,
            grouped[type]
        );

        if (mesh) {
            mesh.userData.blockType = type;
            worldGroup.add(mesh);
        }
    }
}

generateWorldData();
rebuildWorld();

/* PLAYER */

var player = {
    x: 0,
    y: 8,
    z: 0,
    height: 1.7,
    radius: 0.25,
    velocityY: 0,
    speed: 5,
    jump: 6.5,
    onGround: false
};

camera.position.set(
    player.x,
    player.y,
    player.z
);

var yaw = 0;
var pitch = 0;

var keys = {};

document.addEventListener("keydown", function(event) {
    keys[event.code] = true;

    if (
        event.code === "KeyE" &&
        !event.repeat
    ) {
        toggleInventory();
    }

    if (
        event.code === "Space" &&
        player.onGround &&
        !inventoryOpen
    ) {
        player.velocityY = player.jump;
        player.onGround = false;
    }

    if (
        event.code.indexOf("Digit") === 0 &&
        !inventoryOpen
    ) {
        var number = Number(event.code.substring(5));

        if (number >= 1 && number <= 8) {
            var type = blockTypes[number - 1];

            if (inventory[type] > 0) {
                selectedType = type;
                updateHotbar();
            }
        }
    }
});

document.addEventListener("keyup", function(event) {
    keys[event.code] = false;
});

document.addEventListener("mousemove", function(event) {
    if (
        document.pointerLockElement === renderer.domElement &&
        !inventoryOpen
    ) {
        yaw -= event.movementX * 0.002;
        pitch -= event.movementY * 0.002;

        var limit = Math.PI / 2 - 0.05;

        if (pitch > limit) pitch = limit;
        if (pitch < -limit) pitch = -limit;

        camera.rotation.order = "YXZ";
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
    }
});

renderer.domElement.addEventListener("click", function() {
    if (!inventoryOpen) {
        renderer.domElement.requestPointerLock();
    }
});

/* COLLISION */

function isSolidAt(x, y, z) {
    return blockMap.has(blockKey(x, y, z));
}

function playerCollides(px, py, pz) {
    var minX = Math.floor(
        (px - player.radius) / blockSize
    );

    var maxX = Math.floor(
        (px + player.radius) / blockSize
    );

    var minY = Math.floor(
        (py - player.height) / blockSize
    );

    var maxY = Math.floor(
        py / blockSize
    );

    var minZ = Math.floor(
        (pz - player.radius) / blockSize
    );

    var maxZ = Math.floor(
        (pz + player.radius) / blockSize
    );

    for (var x = minX; x <= maxX; x++) {
        for (var y = minY; y <= maxY; y++) {
            for (var z = minZ; z <= maxZ; z++) {
                if (isSolidAt(x, y, z)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function movePlayer(delta) {
    if (inventoryOpen) {
        return;
    }

    var dx = 0;
    var dz = 0;

    if (keys["KeyW"]) dz -= 1;
    if (keys["KeyS"]) dz += 1;
    if (keys["KeyA"]) dx -= 1;
    if (keys["KeyD"]) dx += 1;

    var length = Math.sqrt(dx * dx + dz * dz);

    if (length > 0) {
        dx /= length;
        dz /= length;
    }

    var sin = Math.sin(yaw);
    var cos = Math.cos(yaw);

    var moveX =
        (dx * cos - dz * sin) *
        player.speed *
        delta;

    var moveZ =
        (dx * sin + dz * cos) *
        player.speed *
        delta;

    var newX = player.x + moveX;

    if (!playerCollides(newX, player.y, player.z)) {
        player.x = newX;
    }

    var newZ = player.z + moveZ;

    if (!playerCollides(player.x, player.y, newZ)) {
        player.z = newZ;
    }
}

function updatePhysics(delta) {
    if (inventoryOpen) {
        return;
    }

    player.velocityY -= 16 * delta;

    var newY = player.y + player.velocityY * delta;

    if (!playerCollides(player.x, newY, player.z)) {
        player.y = newY;
        player.onGround = false;
    } else {
        if (player.velocityY < 0) {
            player.onGround = true;
        }

        player.velocityY = 0;
    }

    if (player.y < -10) {
        player.x = 0;
        player.z = 0;
        player.y = 10;
        player.velocityY = 0;
    }
}

/* RAYCASTING */

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0, 0);

function getTargetBlock() {
    raycaster.setFromCamera(mouse, camera);

    var hits = raycaster.intersectObjects(
        worldGroup.children,
        false
    );

    if (hits.length === 0) {
        return null;
    }

    var hit = hits[0];

    if (hit.distance > 6) {
        return null;
    }

    if (
        !hit.object.userData ||
        !hit.object.userData.blockType
    ) {
        return null;
    }

    var type = hit.object.userData.blockType;

    if (hit.instanceId === undefined) {
        return null;
    }

    var matrix = new THREE.Matrix4();

    hit.object.getMatrixAt(
        hit.instanceId,
        matrix
    );

    var position = new THREE.Vector3();

    position.setFromMatrixPosition(matrix);

    var bx = Math.round(position.x / blockSize);
    var by = Math.round(position.y / blockSize);
    var bz = Math.round(position.z / blockSize);

    return {
        x: bx,
        y: by,
        z: bz,
        type: type,
        hit: hit
    };
}

/* BLOCK BREAKING */

function breakBlock() {
    if (inventoryOpen) {
        return;
    }

    var target = getTargetBlock();

    if (!target) {
        return;
    }

    if (target.y <= -4) {
        return;
    }

    var key = blockKey(
        target.x,
        target.y,
        target.z
    );

    var type = blockMap.get(key);

    if (!type) {
        return;
    }

    blockMap.delete(key);

    if (inventory[type] === undefined) {
        inventory[type] = 0;
    }

    inventory[type]++;

    rebuildWorld();
    updateInventoryUI();
    updateHotbar();
}

/* BLOCK PLACING */

function placeBlock() {
    if (inventoryOpen) {
        return;
    }

    if (inventory[selectedType] <= 0) {
        return;
    }

    var target = getTargetBlock();

    if (!target) {
        return;
    }

    var normal = target.hit.face.normal;

    var x =
        target.x +
        Math.round(normal.x);

    var y =
        target.y +
        Math.round(normal.y);

    var z =
        target.z +
        Math.round(normal.z);

    var key = blockKey(x, y, z);

    if (blockMap.has(key)) {
        return;
    }

    blockMap.set(
        key,
        selectedType
    );

    if (
        playerCollides(
            player.x,
            player.y,
            player.z
        )
    ) {
        blockMap.delete(key);
        return;
    }

    inventory[selectedType]--;

    rebuildWorld();
    updateInventoryUI();
    updateHotbar();
}

renderer.domElement.addEventListener(
    "mousedown",
    function(event) {
        if (inventoryOpen) {
            return;
        }

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {
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

renderer.domElement.addEventListener(
    "contextmenu",
    function(event) {
        event.preventDefault();
    }
);

/* BLOCK HIGHLIGHT */

var highlightGeometry = new THREE.BoxGeometry(
    blockSize + 0.015,
    blockSize + 0.015,
    blockSize + 0.015
);

var highlightMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true
    });

var highlight =
    new THREE.Mesh(
        highlightGeometry,
        highlightMaterial
    );

highlight.visible = false;
scene.add(highlight);

function updateHighlight() {
    if (inventoryOpen) {
        highlight.visible = false;
        return;
    }

    var target = getTargetBlock();

    if (!target) {
        highlight.visible = false;
        return;
    }

    highlight.position.set(
        target.x * blockSize,
        target.y * blockSize,
        target.z * blockSize
    );

    highlight.visible = true;
}

/* HOTBAR */

var hotbar = document.createElement("div");

hotbar.style.position = "fixed";
hotbar.style.bottom = "20px";
hotbar.style.left = "50%";
hotbar.style.transform = "translateX(-50%)";
hotbar.style.display = "flex";
hotbar.style.gap = "5px";
hotbar.style.zIndex = "10";

document.body.appendChild(hotbar);

var hotbarSlots = [];

var blockNames = {
    grass: "Grass",
    dirt: "Dirt",
    stone: "Stone",
    wood: "Wood",
    leaves: "Leaves",
    planks: "Planks",
    glass: "Glass",
    bricks: "Bricks"
};

var textureFiles = {
    grass: "./textures/grass_top.png",
    dirt: "./textures/dirt.png",
    stone: "./textures/stone.png",
    wood: "./textures/wood_side.png",
    leaves: "./textures/leaves.png",
    planks: "./textures/planks.png",
    glass: "./textures/glass.png",
    bricks: "./textures/bricks.png"
};

for (var i = 0; i < blockTypes.length; i++) {
    (function(type, index) {

        var slot = document.createElement("div");

        slot.style.width = "48px";
        slot.style.height = "48px";
        slot.style.background = "rgba(0,0,0,0.65)";
        slot.style.border = "2px solid #777";
        slot.style.position = "relative";
        slot.style.boxSizing = "border-box";
        slot.style.backgroundImage =
            "url('" + textureFiles[type] + "')";
        slot.style.backgroundSize = "cover";
        slot.style.cursor = "pointer";

        var number = document.createElement("div");

        number.textContent = String(index + 1);
        number.style.position = "absolute";
        number.style.left = "3px";
        number.style.top = "2px";
        number.style.color = "white";
        number.style.fontSize = "11px";
        number.style.textShadow = "1px 1px 2px black";

        var count = document.createElement("div");

        count.style.position = "absolute";
        count.style.right = "3px";
        count.style.bottom = "1px";
        count.style.color = "white";
        count.style.fontWeight = "bold";
        count.style.fontSize = "13px";
        count.style.textShadow = "1px 1px 2px black";

        slot.appendChild(number);
        slot.appendChild(count);

        slot.addEventListener("click", function(event) {
            event.stopPropagation();

            if (inventory[type] > 0) {
                selectedType = type;
                updateHotbar();
            }
        });

        hotbar.appendChild(slot);
        hotbarSlots.push({
            element: slot,
            count: count,
            type: type
        });

    })(blockTypes[i], i);
}

function updateHotbar() {
    for (var i = 0; i < hotbarSlots.length; i++) {
        var slot = hotbarSlots[i];
        var type = slot.type;

        slot.count.textContent =
            String(inventory[type]);

        if (selectedType === type) {
            slot.element.style.border =
                "3px solid white";
        } else {
            slot.element.style.border =
                "2px solid #777";
        }

        if (inventory[type] <= 0) {
            slot.element.style.opacity = "0.4";
        } else {
            slot.element.style.opacity = "1";
        }
    }
}

/* INVENTORY UI */

var inventoryScreen =
    document.createElement("div");

inventoryScreen.style.position = "fixed";
inventoryScreen.style.left = "50%";
inventoryScreen.style.top = "50%";
inventoryScreen.style.transform =
    "translate(-50%, -50%)";
inventoryScreen.style.width = "430px";
inventoryScreen.style.background =
    "rgba(25,25,25,0.96)";
inventoryScreen.style.border =
    "4px solid #555";
inventoryScreen.style.padding = "20px";
inventoryScreen.style.boxSizing = "border-box";
inventoryScreen.style.zIndex = "20";
inventoryScreen.style.display = "none";
inventoryScreen.style.color = "white";
inventoryScreen.style.fontFamily =
    "Arial, sans-serif";

document.body.appendChild(inventoryScreen);

var inventoryTitle =
    document.createElement("div");

inventoryTitle.textContent =
    "Inventory";

inventoryTitle.style.fontSize = "24px";
inventoryTitle.style.fontWeight = "bold";
inventoryTitle.style.textAlign = "center";
inventoryTitle.style.marginBottom = "15px";

inventoryScreen.appendChild(
    inventoryTitle
);

var inventoryGrid =
    document.createElement("div");

inventoryGrid.style.display = "grid";
inventoryGrid.style.gridTemplateColumns =
    "repeat(4, 1fr)";
inventoryGrid.style.gap = "10px";

inventoryScreen.appendChild(
    inventoryGrid
);

var inventorySlots = [];

for (var i = 0; i < blockTypes.length; i++) {
    (function(type) {

        var slot =
            document.createElement("div");

        slot.style.height = "80px";
        slot.style.background =
            "rgba(0,0,0,0.6)";
        slot.style.border =
            "2px solid #666";
        slot.style.position = "relative";
        slot.style.backgroundImage =
            "url('" + textureFiles[type] + "')";
        slot.style.backgroundSize = "42px 42px";
        slot.style.backgroundPosition =
            "center 8px";
        slot.style.backgroundRepeat =
            "no-repeat";
        slot.style.cursor = "pointer";
        slot.style.boxSizing = "border-box";

        var name =
            document.createElement("div");

        name.textContent =
            blockNames[type];

        name.style.position = "absolute";
        name.style.left = "0";
        name.style.right = "0";
        name.style.bottom = "3px";
        name.style.textAlign = "center";
        name.style.fontSize = "12px";
        name.style.textShadow =
            "1px 1px 2px black";

        var count =
            document.createElement("div");

        count.style.position = "absolute";
        count.style.top = "3px";
        count.style.right = "5px";
        count.style.fontWeight = "bold";
        count.style.fontSize = "14px";
        count.style.textShadow =
            "1px 1px 2px black";

        slot.appendChild(name);
        slot.appendChild(count);

        slot.addEventListener(
            "click",
            function(event) {
                event.stopPropagation();

                if (inventory[type] > 0) {
                    selectedType = type;
                    updateHotbar();
                    updateInventoryUI();

                    inventoryOpen = false;
                    inventoryScreen.style.display =
                        "none";

                    highlight.visible = false;
                }
            }
        );

        inventoryGrid.appendChild(slot);

        inventorySlots.push({
            element: slot,
            count: count,
            type: type
        });

    })(blockTypes[i]);
}

var inventoryHelp =
    document.createElement("div");

inventoryHelp.textContent =
    "Click a block to select it • Press E to close";

inventoryHelp.style.textAlign = "center";
inventoryHelp.style.marginTop = "15px";
inventoryHelp.style.fontSize = "13px";
inventoryHelp.style.color = "#bbb";

inventoryScreen.appendChild(
    inventoryHelp
);

function updateInventoryUI() {
    for (var i = 0; i < inventorySlots.length; i++) {
        var slot = inventorySlots[i];
        var type = slot.type;

        slot.count.textContent =
            "x" + inventory[type];

        if (selectedType === type) {
            slot.element.style.border =
                "3px solid white";
        } else {
            slot.element.style.border =
                "2px solid #666";
        }

        if (inventory[type] <= 0) {
            slot.element.style.opacity = "0.35";
        } else {
            slot.element.style.opacity = "1";
        }
    }
}

function toggleInventory() {
    inventoryOpen = !inventoryOpen;

    if (inventoryOpen) {
        inventoryScreen.style.display =
            "block";

        if (
            document.pointerLockElement ===
            renderer.domElement
        ) {
            document.exitPointerLock();
        }

        highlight.visible = false;

        updateInventoryUI();
        updateHotbar();

    } else {
        inventoryScreen.style.display =
            "none";
    }
}

updateInventoryUI();
updateHotbar();

/* CROSSHAIR */

var crosshair =
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
crosshair.style.textShadow =
    "1px 1px 3px black";
crosshair.style.zIndex = "5";
crosshair.style.pointerEvents = "none";

document.body.appendChild(crosshair);

/* INFO */

var info =
    document.createElement("div");

info.innerHTML =
    "WASD = Move | Space = Jump | Left Click = Break | Right Click = Place | E = Inventory";

info.style.position = "fixed";
info.style.top = "10px";
info.style.left = "10px";
info.style.color = "white";
info.style.fontFamily = "Arial, sans-serif";
info.style.fontSize = "13px";
info.style.background =
    "rgba(0,0,0,0.45)";
info.style.padding = "7px";
info.style.zIndex = "5";
info.style.pointerEvents = "none";

document.body.appendChild(info);

/* GAME LOOP */

function animate() {
    requestAnimationFrame(animate);

    var delta = clock.getDelta();

    if (delta > 0.05) {
        delta = 0.05;
    }

    if (!inventoryOpen) {
        movePlayer(delta);
        updatePhysics(delta);
    }

    camera.position.set(
        player.x,
        player.y,
        player.z
    );

    updateHighlight();

    renderer.render(
        scene,
        camera
    );
}

animate();

/* RESIZE */

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
