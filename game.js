```javascript
/* MINTCRAFT - COMPLETE GAME.JS */

(function () {
    "use strict";

    /* =========================
       LOAD THREE.JS
    ========================= */

    function startGame() {
        if (window.THREE) {
            initGame();
            return;
        }

        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.min.js";
        script.onload = initGame;
        script.onerror = function () {
            document.body.innerHTML =
                "<div style='color:white;background:#111;padding:30px;font-family:Arial'>" +
                "MintCraft could not load Three.js. Check your internet connection.</div>";
        };

        document.head.appendChild(script);
    }

    /* =========================
       GAME
    ========================= */

    function initGame() {

        var THREE = window.THREE;

        /* =========================
           SETTINGS
        ========================= */

        var BLOCK_SIZE = 1;
        var WORLD_SIZE = 48;
        var WORLD_HEIGHT = 20;

        var PLAYER_WIDTH = 0.55;
        var PLAYER_HEIGHT = 1.75;
        var PLAYER_EYE = 1.55;

        var MOVE_SPEED = 5.0;
        var GRAVITY = 18;
        var JUMP_POWER = 7.0;

        var REACH = 6;

        /* =========================
           BLOCKS
        ========================= */

        var BLOCKS = {
            grass:   { id: 1, name: "Grass",   texture: "grass_side.png", solid: true },
            dirt:    { id: 2, name: "Dirt",    texture: "dirt.png",        solid: true },
            stone:   { id: 3, name: "Stone",   texture: "stone.png",       solid: true },
            wood:    { id: 4, name: "Wood",    texture: "wood_side.png",   solid: true },
            leaves:  { id: 5, name: "Leaves",  texture: "leaves.png",      solid: true },
            planks:  { id: 6, name: "Planks",  texture: "planks.png",      solid: true },
            glass:   { id: 7, name: "Glass",   texture: "glass.png",       solid: true },
            bricks:  { id: 8, name: "Bricks",  texture: "bricks.png",      solid: true }
        };

        var blockNames = [
            "grass",
            "dirt",
            "stone",
            "wood",
            "leaves",
            "planks",
            "glass",
            "bricks"
        ];

        /* =========================
           SCENE
        ========================= */

        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);

        scene.fog = new THREE.Fog(0x87ceeb, 35, 95);

        var camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.05,
            200
        );

        camera.rotation.order = "YXZ";

        var renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: "high-performance"
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

        document.body.appendChild(renderer.domElement);

        /* =========================
           LIGHTING
        ========================= */

        var ambient = new THREE.HemisphereLight(
            0xffffff,
            0x555555,
            1.5
        );

        scene.add(ambient);

        var sun = new THREE.DirectionalLight(0xffffff, 1.4);
        sun.position.set(40, 70, 30);
        scene.add(sun);

        /* =========================
           TEXTURES
        ========================= */

        var textureLoader = new THREE.TextureLoader();

        function loadTexture(name) {
            var t = textureLoader.load("textures/" + name);

            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;

            return t;
        }

        var textures = {};

        Object.keys(BLOCKS).forEach(function (name) {
            textures[name] = loadTexture(BLOCKS[name].texture);
        });

        /* =========================
           WORLD DATA
        ========================= */

        var world = new Map();

        function key(x, y, z) {
            return x + "," + y + "," + z;
        }

        function addBlock(x, y, z, type) {
            if (
                x < -WORLD_SIZE ||
                x > WORLD_SIZE ||
                z < -WORLD_SIZE ||
                z > WORLD_SIZE ||
                y < 0 ||
                y > WORLD_HEIGHT
            ) {
                return;
            }

            world.set(key(x, y, z), {
                x: x,
                y: y,
                z: z,
                type: type
            });
        }

        function removeBlock(x, y, z) {
            world.delete(key(x, y, z));
        }

        function getBlock(x, y, z) {
            return world.get(key(x, y, z));
        }

        function isSolid(x, y, z) {
            var b = getBlock(x, y, z);

            if (!b) return false;

            return BLOCKS[b.type].solid;
        }

        /* =========================
           TERRAIN
        ========================= */

        function terrainHeight(x, z) {

            var h =
                4 +
                Math.sin(x * 0.15) * 2 +
                Math.cos(z * 0.13) * 2 +
                Math.sin((x + z) * 0.07) * 2;

            h = Math.floor(h);

            if (h < 1) h = 1;
            if (h > 10) h = 10;

            return h;
        }

        function generateTerrain() {

            for (var x = -WORLD_SIZE; x <= WORLD_SIZE; x++) {

                for (var z = -WORLD_SIZE; z <= WORLD_SIZE; z++) {

                    var h = terrainHeight(x, z);

                    for (var y = 0; y <= h; y++) {

                        if (y === h) {
                            addBlock(x, y, z, "grass");
                        }
                        else if (y >= h - 2) {
                            addBlock(x, y, z, "dirt");
                        }
                        else {
                            addBlock(x, y, z, "stone");
                        }
                    }
                }
            }
        }

        /* =========================
           TREES
        ========================= */

        function canTreeGrow(x, z) {

            var h = terrainHeight(x, z);

            if (h < 3) return false;

            var b = getBlock(x, h, z);

            if (!b || b.type !== "grass") {
                return false;
            }

            return true;
        }

        function makeTree(x, z) {

            if (!canTreeGrow(x, z)) return;

            var base = terrainHeight(x, z);

            var treeHeight = 4;

            for (var y = 1; y <= treeHeight; y++) {
                addBlock(x, base + y, z, "wood");
            }

            for (var dx = -2; dx <= 2; dx++) {

                for (var dz = -2; dz <= 2; dz++) {

                    for (var dy = 0; dy <= 2; dy++) {

                        var distance =
                            Math.abs(dx) +
                            Math.abs(dz);

                        if (distance <= 3) {

                            addBlock(
                                x + dx,
                                base + treeHeight - 1 + dy,
                                z + dz,
                                "leaves"
                            );
                        }
                    }
                }
            }

            addBlock(
                x,
                base + treeHeight + 2,
                z,
                "leaves"
            );
        }

        function generateTrees() {

            for (
                var x = -WORLD_SIZE + 3;
                x <= WORLD_SIZE - 3;
                x += 4
            ) {

                for (
                    var z = -WORLD_SIZE + 3;
                    z <= WORLD_SIZE - 3;
                    z += 4
                ) {

                    var chance =
                        Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;

                    chance = chance - Math.floor(chance);

                    if (chance > 0.78) {
                        makeTree(x, z);
                    }
                }
            }
        }

        generateTerrain();
        generateTrees();

        /* =========================
           INSTANCED RENDERING
        ========================= */

        var meshes = {};
        var geometries = {};
        var materials = {};

        var dummy = new THREE.Object3D();

        function buildWorldMeshes() {

            Object.keys(meshes).forEach(function (name) {

                scene.remove(meshes[name]);

                if (meshes[name].dispose) {
                    meshes[name].dispose();
                }
            });

            meshes = {};

            var counts = {};

            blockNames.forEach(function (name) {
                counts[name] = 0;
            });

            world.forEach(function (block) {

                if (counts[block.type] !== undefined) {
                    counts[block.type]++;
                }
            });

            blockNames.forEach(function (name) {

                var count = counts[name];

                if (count <= 0) return;

                if (!geometries[name]) {
                    geometries[name] =
                        new THREE.BoxGeometry(1, 1, 1);
                }

                if (!materials[name]) {

                    materials[name] =
                        new THREE.MeshLambertMaterial({
                            map: textures[name],
                            transparent: name === "glass",
                            opacity: name === "glass" ? 0.55 : 1,
                            depthWrite: name !== "glass"
                        });
                }

                var mesh =
                    new THREE.InstancedMesh(
                        geometries[name],
                        materials[name],
                        count
                    );

                mesh.userData.blockType = name;

                var index = 0;

                world.forEach(function (block) {

                    if (block.type !== name) return;

                    dummy.position.set(
                        block.x,
                        block.y,
                        block.z
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

                    index++;
                });

                mesh.instanceMatrix.needsUpdate = true;

                scene.add(mesh);

                meshes[name] = mesh;
            });
        }

        buildWorldMeshes();

        /* =========================
           PLAYER
        ========================= */

        var player = {
            x: 0,
            y: terrainHeight(0, 0) + 1.01,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            grounded: false
        };

        camera.position.set(
            player.x,
            player.y + PLAYER_EYE,
            player.z
        );

        /* =========================
           CONTROLS
        ========================= */

        var keys = {};

        window.addEventListener("keydown", function (event) {

            keys[event.code] = true;

            if (
                event.code === "Digit1" ||
                event.code === "Digit2" ||
                event.code === "Digit3" ||
                event.code === "Digit4" ||
                event.code === "Digit5" ||
                event.code === "Digit6" ||
                event.code === "Digit7" ||
                event.code === "Digit8"
            ) {

                selectedSlot =
                    Number(event.code.replace("Digit", "")) - 1;

                updateHotbar();
            }

            if (event.code === "KeyE") {
                toggleInventory();
            }

            if (
                event.code === "Space" &&
                player.grounded &&
                !inventoryOpen
            ) {
                player.vy = JUMP_POWER;
                player.grounded = false;
            }
        });

        window.addEventListener("keyup", function (event) {
            keys[event.code] = false;
        });

        /* =========================
           MOUSE LOOK
        ========================= */

        var yaw = 0;
        var pitch = 0;

        renderer.domElement.addEventListener("click", function () {

            if (!inventoryOpen) {
                renderer.domElement.requestPointerLock();
            }
        });

        document.addEventListener("mousemove", function (event) {

            if (
                document.pointerLockElement !== renderer.domElement ||
                inventoryOpen
            ) {
                return;
            }

            yaw -= event.movementX * 0.002;
            pitch -= event.movementY * 0.002;

            var limit = Math.PI / 2 - 0.05;

            if (pitch > limit) pitch = limit;
            if (pitch < -limit) pitch = -limit;

            camera.rotation.y = yaw;
            camera.rotation.x = pitch;
        });

        /* =========================
           COLLISION
        ========================= */

        function boxCollides(px, py, pz) {

            var minX = Math.floor(px - PLAYER_WIDTH / 2);
            var maxX = Math.floor(px + PLAYER_WIDTH / 2);

            var minY = Math.floor(py);
            var maxY = Math.floor(py + PLAYER_HEIGHT - 0.001);

            var minZ = Math.floor(pz - PLAYER_WIDTH / 2);
            var maxZ = Math.floor(pz + PLAYER_WIDTH / 2);

            for (var x = minX; x <= maxX; x++) {

                for (var y = minY; y <= maxY; y++) {

                    for (var z = minZ; z <= maxZ; z++) {

                        if (isSolid(x, y, z)) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        function horizontalCollision(px, py, pz) {

            var minX =
                Math.floor(px - PLAYER_WIDTH / 2);

            var maxX =
                Math.floor(px + PLAYER_WIDTH / 2);

            var minY =
                Math.floor(py + 0.05);

            var maxY =
                Math.floor(py + PLAYER_HEIGHT - 0.05);

            var minZ =
                Math.floor(pz - PLAYER_WIDTH / 2);

            var maxZ =
                Math.floor(pz + PLAYER_WIDTH / 2);

            for (var x = minX; x <= maxX; x++) {

                for (var y = minY; y <= maxY; y++) {

                    for (var z = minZ; z <= maxZ; z++) {

                        if (isSolid(x, y, z)) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        function groundCollision(px, py, pz) {

            var feetY = py;

            var minX =
                Math.floor(px - PLAYER_WIDTH / 2);

            var maxX =
                Math.floor(px + PLAYER_WIDTH / 2);

            var minZ =
                Math.floor(pz - PLAYER_WIDTH / 2);

            var maxZ =
                Math.floor(pz + PLAYER_WIDTH / 2);

            var blockY = Math.floor(feetY - 0.05);

            for (var x = minX; x <= maxX; x++) {

                for (var z = minZ; z <= maxZ; z++) {

                    if (isSolid(x, blockY, z)) {
                        return true;
                    }
                }
            }

            return false;
        }

        /* =========================
           MOVEMENT
        ========================= */

        function updateMovement(dt) {

            if (inventoryOpen) {
                player.vx = 0;
                player.vz = 0;
                return;
            }

            var forward = 0;
            var right = 0;

            if (keys["KeyW"]) forward += 1;
            if (keys["KeyS"]) forward -= 1;
            if (keys["KeyD"]) right += 1;
            if (keys["KeyA"]) right -= 1;

            var length =
                Math.sqrt(
                    forward * forward +
                    right * right
                );

            if (length > 0) {

                forward /= length;
                right /= length;

                var sin = Math.sin(yaw);
                var cos = Math.cos(yaw);

                var moveX =
                    (-sin * forward) +
                    (cos * right);

                var moveZ =
                    (-cos * forward) +
                    (-sin * right);

                player.vx = moveX * MOVE_SPEED;
                player.vz = moveZ * MOVE_SPEED;
            }
            else {
                player.vx = 0;
                player.vz = 0;
            }

            /* X collision */

            var newX =
                player.x + player.vx * dt;

            if (
                !horizontalCollision(
                    newX,
                    player.y,
                    player.z
                )
            ) {
                player.x = newX;
            }

            /* Z collision */

            var newZ =
                player.z + player.vz * dt;

            if (
                !horizontalCollision(
                    player.x,
                    player.y,
                    newZ
                )
            ) {
                player.z = newZ;
            }
        }

        /* =========================
           PHYSICS
        ========================= */

        function updatePhysics(dt) {

            if (inventoryOpen) return;

            player.vy -= GRAVITY * dt;

            var oldY = player.y;

            var newY =
                player.y +
                player.vy * dt;

            /* Falling */

            if (player.vy <= 0) {

                var feetBlock =
                    Math.floor(newY - 0.001);

                var minX =
                    Math.floor(
                        player.x - PLAYER_WIDTH / 2
                    );

                var maxX =
                    Math.floor(
                        player.x + PLAYER_WIDTH / 2
                    );

                var minZ =
                    Math.floor(
                        player.z - PLAYER_WIDTH / 2
                    );

                var maxZ =
                    Math.floor(
                        player.z + PLAYER_WIDTH / 2
                    );

                var landed = false;

                for (
                    var x = minX;
                    x <= maxX;
                    x++
                ) {

                    for (
                        var z = minZ;
                        z <= maxZ;
                        z++
                    ) {

                        if (
                            isSolid(
                                x,
                                feetBlock,
                                z
                            )
                        ) {
                            landed = true;
                        }
                    }
                }

                if (landed) {

                    player.y =
                        feetBlock + 1.001;

                    player.vy = 0;
                    player.grounded = true;

                }
                else {

                    player.y = newY;
                    player.grounded = false;
                }

            }
            else {

                /* Rising */

                var headY =
                    newY + PLAYER_HEIGHT;

                var blockY =
                    Math.floor(headY);

                var minX2 =
                    Math.floor(
                        player.x - PLAYER_WIDTH / 2
                    );

                var maxX2 =
                    Math.floor(
                        player.x + PLAYER_WIDTH / 2
                    );

                var minZ2 =
                    Math.floor(
                        player.z - PLAYER_WIDTH / 2
                    );

                var maxZ2 =
                    Math.floor(
                        player.z + PLAYER_WIDTH / 2
                    );

                var hitHead = false;

                for (
                    var xx = minX2;
                    xx <= maxX2;
                    xx++
                ) {

                    for (
                        var zz = minZ2;
                        zz <= maxZ2;
                        zz++
                    ) {

                        if (
                            isSolid(
                                xx,
                                blockY,
                                zz
                            )
                        ) {
                            hitHead = true;
                        }
                    }
                }

                if (hitHead) {

                    player.y =
                        blockY -
                        PLAYER_HEIGHT -
                        0.001;

                    player.vy = 0;

                }
                else {
                    player.y = newY;
                }

                player.grounded = false;
            }

            /* Emergency recovery */

            if (player.y < -20) {

                player.x = 0;
                player.z = 0;

                player.y =
                    terrainHeight(0, 0) + 1.01;

                player.vy = 0;
            }

            camera.position.set(
                player.x,
                player.y + PLAYER_EYE,
                player.z
            );
        }

        /* =========================
           HOTBAR
        ========================= */

        var selectedSlot = 0;

        var inventory = {
            grass: 20,
            dirt: 20,
            stone: 20,
            wood: 20,
            leaves: 20,
            planks: 20,
            glass: 20,
            bricks: 20
        };

        var hotbar = document.createElement("div");

        hotbar.style.position = "fixed";
        hotbar.style.bottom = "15px";
        hotbar.style.left = "50%";
        hotbar.style.transform = "translateX(-50%)";
        hotbar.style.display = "flex";
        hotbar.style.gap = "5px";
        hotbar.style.zIndex = "20";

        document.body.appendChild(hotbar);

        function updateHotbar() {

            hotbar.innerHTML = "";

            blockNames.forEach(function (name, index) {

                var slot =
                    document.createElement("div");

                slot.style.width = "52px";
                slot.style.height = "52px";
                slot.style.background = "rgba(0,0,0,0.65)";
                slot.style.border =
                    index === selectedSlot
                        ? "3px solid white"
                        : "2px solid #777";

                slot.style.boxSizing = "border-box";
                slot.style.position = "relative";

                var image =
                    document.createElement("img");

                image.src =
                    "textures/" +
                    BLOCKS[name].texture;

                image.style.width = "100%";
                image.style.height = "100%";
                image.style.imageRendering = "pixelated";

                slot.appendChild(image);

                var number =
                    document.createElement("span");

                number.textContent =
                    String(index + 1);

                number.style.position = "absolute";
                number.style.left = "3px";
                number.style.top = "2px";
                number.style.color = "white";
                number.style.font =
                    "bold 12px Arial";

                slot.appendChild(number);

                var amount =
                    document.createElement("span");

                amount.textContent =
                    String(inventory[name] || 0);

                amount.style.position = "absolute";
                amount.style.right = "3px";
                amount.style.bottom = "2px";
                amount.style.color = "white";
                amount.style.font =
                    "bold 12px Arial";

                slot.appendChild(amount);

                slot.onclick = function () {

                    selectedSlot = index;

                    updateHotbar();
                };

                hotbar.appendChild(slot);
            });
        }

        updateHotbar();

        /* =========================
           INVENTORY
        ========================= */

        var inventoryOpen = false;

        var inventoryPanel =
            document.createElement("div");

        inventoryPanel.style.position = "fixed";
        inventoryPanel.style.left = "50%";
        inventoryPanel.style.top = "50%";
        inventoryPanel.style.transform =
            "translate(-50%,-50%)";

        inventoryPanel.style.background =
            "rgba(25,25,25,0.96)";

        inventoryPanel.style.padding = "20px";
        inventoryPanel.style.border =
            "3px solid white";

        inventoryPanel.style.display = "none";
        inventoryPanel.style.gridTemplateColumns =
            "repeat(4,80px)";

        inventoryPanel.style.gap = "10px";
        inventoryPanel.style.zIndex = "30";

        document.body.appendChild(inventoryPanel);

        function updateInventory() {

            inventoryPanel.innerHTML = "";

            blockNames.forEach(function (name, index) {

                var slot =
                    document.createElement("div");

                slot.style.width = "80px";
                slot.style.height = "80px";
                slot.style.background =
                    "rgba(0,0,0,0.7)";

                slot.style.border =
                    index === selectedSlot
                        ? "3px solid yellow"
                        : "2px solid #777";

                slot.style.position = "relative";
                slot.style.cursor = "pointer";

                var img =
                    document.createElement("img");

                img.src =
                    "textures/" +
                    BLOCKS[name].texture;

                img.style.width = "100%";
                img.style.height = "100%";
                img.style.imageRendering =
                    "pixelated";

                slot.appendChild(img);

                var label =
                    document.createElement("div");

                label.textContent =
                    BLOCKS[name].name;

                label.style.position =
                    "absolute";

                label.style.left = "3px";
                label.style.top = "3px";
                label.style.color = "white";
                label.style.font =
                    "bold 11px Arial";

                slot.appendChild(label);

                var count =
                    document.createElement("div");

                count.textContent =
                    String(inventory[name] || 0);

                count.style.position =
                    "absolute";

                count.style.right = "4px";
                count.style.bottom = "3px";
                count.style.color = "white";
                count.style.font =
                    "bold 14px Arial";

                slot.appendChild(count);

                slot.onclick = function () {

                    selectedSlot = index;

                    updateHotbar();
                    updateInventory();
                };

                inventoryPanel.appendChild(slot);
            });
        }

        function toggleInventory() {

            inventoryOpen = !inventoryOpen;

            if (inventoryOpen) {

                inventoryPanel.style.display = "grid";

                if (
                    document.pointerLockElement
                ) {
                    document.exitPointerLock();
                }

                updateInventory();

            }
            else {

                inventoryPanel.style.display =
                    "none";
            }
        }

        /* =========================
           CROSSHAIR
        ========================= */

        var crosshair =
            document.createElement("div");

        crosshair.textContent = "+";

        crosshair.style.position = "fixed";
        crosshair.style.left = "50%";
        crosshair.style.top = "50%";
        crosshair.style.transform =
            "translate(-50%,-50%)";

        crosshair.style.color = "white";
        crosshair.style.font =
            "bold 28px Arial";

        crosshair.style.pointerEvents =
            "none";

        crosshair.style.zIndex = "10";

        document.body.appendChild(crosshair);

        /* =========================
           TARGETING
        ========================= */

        var raycaster =
            new THREE.Raycaster();

        var center =
            new THREE.Vector2(0, 0);

        var targetBlock = null;

        function findTarget() {

            targetBlock = null;

            raycaster.setFromCamera(
                center,
                camera
            );

            var objects = [];

            Object.keys(meshes).forEach(
                function (name) {
                    objects.push(meshes[name]);
                }
            );

            var hits =
                raycaster.intersectObjects(
                    objects,
                    false
                );

            if (!hits.length) return;

            var hit = hits[0];

            if (hit.distance > REACH) return;

            var mesh = hit.object;

            var type =
                mesh.userData.blockType;

            if (!type) return;

            var instance =
                hit.instanceId;

            if (
                instance === undefined ||
                instance === null
            ) {
                return;
            }

            var found = null;
            var index = 0;

            world.forEach(function (block) {

                if (found) return;

                if (block.type !== type) return;

                if (index === instance) {
                    found = block;
                }

                index++;
            });

            if (!found) return;

            targetBlock = {
                block: found,
                normal: hit.face.normal.clone()
            };
        }

        /* =========================
           HIGHLIGHT
        ========================= */

        var highlightGeometry =
            new THREE.BoxGeometry(
                1.02,
                1.02,
                1.02
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

            findTarget();

            if (!targetBlock) {

                highlight.visible = false;
                return;
            }

            var b =
                targetBlock.block;

            highlight.position.set(
                b.x,
                b.y,
                b.z
            );

            highlight.visible = true;
        }

        /* =========================
           BREAK / PLACE
        ========================= */

        function rebuild() {
            buildWorldMeshes();
        }

        renderer.domElement.addEventListener(
            "mousedown",
            function (event) {

                if (
                    inventoryOpen ||
                    document.pointerLockElement !==
                    renderer.domElement
                ) {
                    return;
                }

                findTarget();

                if (!targetBlock) return;

                var b =
                    targetBlock.block;

                /* LEFT CLICK = BREAK */

                if (event.button === 0) {

                    removeBlock(
                        b.x,
                        b.y,
                        b.z
                    );

                    inventory[b.type] =
                        (inventory[b.type] || 0) + 1;

                    rebuild();

                    updateHotbar();
                    updateInventory();

                }

                /* RIGHT CLICK = PLACE */

                if (event.button === 2) {

                    var selected =
                        blockNames[selectedSlot];

                    if (
                        !selected ||
                        (inventory[selected] || 0) <= 0
                    ) {
                        return;
                    }

                    var n =
                        targetBlock.normal;

                    var px =
                        b.x + Math.round(n.x);

                    var py =
                        b.y + Math.round(n.y);

                    var pz =
                        b.z + Math.round(n.z);

                    if (getBlock(px, py, pz)) {
                        return;
                    }

                    /* Don't place a block inside player */

                    var playerMinX =
                        player.x -
                        PLAYER_WIDTH / 2;

                    var playerMaxX =
                        player.x +
                        PLAYER_WIDTH / 2;

                    var playerMinZ =
                        player.z -
                        PLAYER_WIDTH / 2;

                    var playerMaxZ =
                        player.z +
                        PLAYER_WIDTH / 2;

                    var blockMinX = px - 0.5;
                    var blockMaxX = px + 0.5;

                    var blockMinZ = pz - 0.5;
                    var blockMaxZ = pz + 0.5;

                    var overlapsX =
                        playerMaxX > blockMinX &&
                        playerMinX < blockMaxX;

                    var overlapsZ =
                        playerMaxZ > blockMinZ &&
                        playerMinZ < blockMaxZ;

                    var overlapsY =
                        player.y <
                            py + 0.5 &&
                        player.y + PLAYER_HEIGHT >
                            py - 0.5;

                    if (
                        overlapsX &&
                        overlapsZ &&
                        overlapsY
                    ) {
                        return;
                    }

                    addBlock(
                        px,
                        py,
                        pz,
                        selected
                    );

                    inventory[selected]--;

                    rebuild();

                    updateHotbar();
                    updateInventory();
                }
            }
        );

        renderer.domElement.addEventListener(
            "contextmenu",
            function (event) {
                event.preventDefault();
            }
        );

        /* =========================
           RESIZE
        ========================= */

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

                renderer.setPixelRatio(
                    Math.min(
                        window.devicePixelRatio || 1,
                        1.5
                    )
                );
            }
        );

        /* =========================
           GAME LOOP
        ========================= */

        var lastTime =
            performance.now();

        function animate(now) {

            requestAnimationFrame(animate);

            var dt =
                (now - lastTime) / 1000;

            lastTime = now;

            /* Prevent huge physics jumps */

            if (dt > 0.05) {
                dt = 0.05;
            }

            updateMovement(dt);
            updatePhysics(dt);

            updateHighlight();

            renderer.render(
                scene,
                camera
            );
        }

        animate(performance.now());
    }

    startGame();

})();
```
