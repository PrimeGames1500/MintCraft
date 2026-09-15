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

        script.onload = function () {
            initGame();
        };

        script.onerror = function () {
            document.body.innerHTML =
                "<div style='background:#111;color:white;padding:30px;font-family:Arial'>" +
                "MintCraft could not load Three.js." +
                "</div>";
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

        var WORLD_SIZE = 48;
        var WORLD_HEIGHT = 20;

        var PLAYER_WIDTH = 0.55;
        var PLAYER_HEIGHT = 1.75;
        var PLAYER_EYE = 1.55;

        var MOVE_SPEED = 5.0;
        var GRAVITY = 18.0;
        var JUMP_POWER = 7.0;

        var REACH = 6;

        /* =========================
           BLOCKS
        ========================= */

        var BLOCKS = {
            grass: {
                id: 1,
                name: "Grass",
                texture: "grass_side.png",
                solid: true
            },

            dirt: {
                id: 2,
                name: "Dirt",
                texture: "dirt.png",
                solid: true
            },

            stone: {
                id: 3,
                name: "Stone",
                texture: "stone.png",
                solid: true
            },

            wood: {
                id: 4,
                name: "Wood",
                texture: "wood_side.png",
                solid: true
            },

            leaves: {
                id: 5,
                name: "Leaves",
                texture: "leaves.png",
                solid: true
            },

            planks: {
                id: 6,
                name: "Planks",
                texture: "planks.png",
                solid: true
            },

            glass: {
                id: 7,
                name: "Glass",
                texture: "glass.png",
                solid: true
            },

            bricks: {
                id: 8,
                name: "Bricks",
                texture: "bricks.png",
                solid: true
            }
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

        scene.fog = new THREE.Fog(
            0x87ceeb,
            35,
            100
        );

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

        renderer.outputColorSpace =
            THREE.SRGBColorSpace;

        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";

        document.body.appendChild(
            renderer.domElement
        );

        /* =========================
           LIGHTING
        ========================= */

        var ambient =
            new THREE.HemisphereLight(
                0xffffff,
                0x555555,
                1.5
            );

        scene.add(ambient);

        var sun =
            new THREE.DirectionalLight(
                0xffffff,
                1.4
            );

        sun.position.set(
            40,
            70,
            30
        );

        scene.add(sun);

        /* =========================
           TEXTURES
        ========================= */

        var textureLoader =
            new THREE.TextureLoader();

        var textures = {};

        function loadTexture(filename) {

            var texture =
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

        textures.grassSide =
            loadTexture("grass_side.png");

        textures.grassTop =
            loadTexture("grass_top.png");

        textures.dirt =
            loadTexture("dirt.png");

        textures.stone =
            loadTexture("stone.png");

        textures.woodSide =
            loadTexture("wood_side.png");

        textures.woodTop =
            loadTexture("wood_top.png");

        textures.leaves =
            loadTexture("leaves.png");

        textures.planks =
            loadTexture("planks.png");

        textures.glass =
            loadTexture("glass.png");

        textures.bricks =
            loadTexture("bricks.png");

        /* =========================
           WORLD
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
                y > WORLD_HEIGHT + 10
            ) {
                return;
            }

            world.set(
                key(x, y, z),
                {
                    x: x,
                    y: y,
                    z: z,
                    type: type
                }
            );
        }

        function removeBlock(x, y, z) {
            world.delete(
                key(x, y, z)
            );
        }

        function getBlock(x, y, z) {
            return world.get(
                key(x, y, z)
            );
        }

        function isSolid(x, y, z) {

            var block =
                getBlock(x, y, z);

            if (!block) {
                return false;
            }

            return BLOCKS[
                block.type
            ].solid;
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

            if (h < 1) {
                h = 1;
            }

            if (h > 10) {
                h = 10;
            }

            return h;
        }

        function generateTerrain() {

            for (
                var x = -WORLD_SIZE;
                x <= WORLD_SIZE;
                x++
            ) {

                for (
                    var z = -WORLD_SIZE;
                    z <= WORLD_SIZE;
                    z++
                ) {

                    var h =
                        terrainHeight(
                            x,
                            z
                        );

                    for (
                        var y = 0;
                        y <= h;
                        y++
                    ) {

                        if (y === h) {

                            addBlock(
                                x,
                                y,
                                z,
                                "grass"
                            );

                        } else if (
                            y >= h - 2
                        ) {

                            addBlock(
                                x,
                                y,
                                z,
                                "dirt"
                            );

                        } else {

                            addBlock(
                                x,
                                y,
                                z,
                                "stone"
                            );
                        }
                    }
                }
            }
        }

        /* =========================
           TREES
        ========================= */

        function canTreeGrow(x, z) {

            var h =
                terrainHeight(x, z);

            if (h < 3) {
                return false;
            }

            var block =
                getBlock(
                    x,
                    h,
                    z
                );

            return (
                block &&
                block.type === "grass"
            );
        }

        function makeTree(x, z) {

            if (!canTreeGrow(x, z)) {
                return;
            }

            var base =
                terrainHeight(
                    x,
                    z
                );

            var treeHeight = 4;

            for (
                var y = 1;
                y <= treeHeight;
                y++
            ) {

                addBlock(
                    x,
                    base + y,
                    z,
                    "wood"
                );
            }

            for (
                var dx = -2;
                dx <= 2;
                dx++
            ) {

                for (
                    var dz = -2;
                    dz <= 2;
                    dz++
                ) {

                    for (
                        var dy = 0;
                        dy <= 2;
                        dy++
                    ) {

                        var distance =
                            Math.abs(dx) +
                            Math.abs(dz);

                        if (
                            distance <= 3
                        ) {

                            addBlock(
                                x + dx,
                                base +
                                    treeHeight -
                                    1 +
                                    dy,
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
                        Math.sin(
                            x * 12.9898 +
                            z * 78.233
                        ) *
                        43758.5453;

                    chance =
                        chance -
                        Math.floor(chance);

                    if (
                        chance > 0.78
                    ) {

                        makeTree(
                            x,
                            z
                        );
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

        var dummy =
            new THREE.Object3D();

        function makeMaterial(
            texture,
            transparent
        ) {

            return new THREE.MeshLambertMaterial({
                map: texture,
                transparent: transparent || false,
                opacity: transparent ? 0.55 : 1,
                depthWrite: !transparent
            });
        }

        function getMaterials(type) {

            if (materials[type]) {
                return materials[type];
            }

            if (type === "grass") {

                materials[type] = [
                    makeMaterial(
                        textures.grassSide
                    ),
                    makeMaterial(
                        textures.grassSide
                    ),
                    makeMaterial(
                        textures.grassTop
                    ),
                    makeMaterial(
                        textures.dirt
                    ),
                    makeMaterial(
                        textures.grassSide
                    ),
                    makeMaterial(
                        textures.grassSide
                    )
                ];

            } else if (type === "wood") {

                materials[type] = [
                    makeMaterial(
                        textures.woodSide
                    ),
                    makeMaterial(
                        textures.woodSide
                    ),
                    makeMaterial(
                        textures.woodTop
                    ),
                    makeMaterial(
                        textures.woodTop
                    ),
                    makeMaterial(
                        textures.woodSide
                    ),
                    makeMaterial(
                        textures.woodSide
                    )
                ];

            } else {

                var texture =
                    textures[type];

                materials[type] =
                    makeMaterial(
                        texture,
                        type === "glass"
                    );
            }

            return materials[type];
        }

        function buildWorldMeshes() {

            blockNames.forEach(
                function (name) {

                    if (meshes[name]) {

                        scene.remove(
                            meshes[name]
                        );

                        meshes[name] = null;
                    }
                }
            );

            var counts = {};

            blockNames.forEach(
                function (name) {
                    counts[name] = 0;
                }
            );

            world.forEach(
                function (block) {

                    if (
                        counts[block.type] !==
                        undefined
                    ) {

                        counts[
                            block.type
                        ]++;
                    }
                }
            );

            blockNames.forEach(
                function (name) {

                    var count =
                        counts[name];

                    if (count <= 0) {
                        return;
                    }

                    if (!geometries[name]) {

                        geometries[name] =
                            new THREE.BoxGeometry(
                                1,
                                1,
                                1
                            );
                    }

                    var mesh =
                        new THREE.InstancedMesh(
                            geometries[name],
                            getMaterials(name),
                            count
                        );

                    mesh.userData.blockType =
                        name;

                    mesh.userData.blocks = [];

                    var index = 0;

                    world.forEach(
                        function (block) {

                            if (
                                block.type !== name
                            ) {
                                return;
                            }

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
                                index,
                                dummy.matrix
                            );

                            mesh.userData.blocks[
                                index
                            ] = block;

                            index++;
                        }
                    );

                    mesh.instanceMatrix.needsUpdate =
                        true;

                    mesh.frustumCulled = true;

                    scene.add(mesh);

                    meshes[name] =
                        mesh;
                }
            );
        }

        buildWorldMeshes();

        /* =========================
           PLAYER
        ========================= */

        var player = {

            x: 0,

            y:
                terrainHeight(0, 0) +
                0.501,

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

        var selectedSlot = 0;

        window.addEventListener(
            "keydown",
            function (event) {

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
                        Number(
                            event.code.replace(
                                "Digit",
                                ""
                            )
                        ) - 1;

                    updateHotbar();
                    updateInventory();
                }

                if (
                    event.code === "KeyE"
                ) {

                    event.preventDefault();

                    toggleInventory();
                }

                if (
                    event.code === "Space" &&
                    player.grounded &&
                    !inventoryOpen
                ) {

                    player.vy =
                        JUMP_POWER;

                    player.grounded =
                        false;
                }
            }
        );

        window.addEventListener(
            "keyup",
            function (event) {

                keys[event.code] = false;
            }
        );

        /* =========================
           MOUSE LOOK
        ========================= */

        var yaw = 0;
        var pitch = 0;

        renderer.domElement.addEventListener(
            "click",
            function () {

                if (
                    !inventoryOpen
                ) {

                    renderer.domElement.requestPointerLock();
                }
            }
        );

        document.addEventListener(
            "mousemove",
            function (event) {

                if (
                    document.pointerLockElement !==
                    renderer.domElement
                ) {
                    return;
                }

                if (inventoryOpen) {
                    return;
                }

                yaw -=
                    event.movementX *
                    0.002;

                pitch -=
                    event.movementY *
                    0.002;

                var limit =
                    Math.PI / 2 -
                    0.05;

                if (pitch > limit) {
                    pitch = limit;
                }

                if (pitch < -limit) {
                    pitch = -limit;
                }

                camera.rotation.y =
                    yaw;

                camera.rotation.x =
                    pitch;
            }
        );

        /* =========================
           COLLISION
        ========================= */

        function overlapsPlayerBlock(
            px,
            py,
            pz,
            bx,
            by,
            bz
        ) {

            var half =
                PLAYER_WIDTH / 2;

            var playerMinX =
                px - half;

            var playerMaxX =
                px + half;

            var playerMinY =
                py;

            var playerMaxY =
                py +
                PLAYER_HEIGHT;

            var playerMinZ =
                pz - half;

            var playerMaxZ =
                pz + half;

            var blockMinX =
                bx - 0.5;

            var blockMaxX =
                bx + 0.5;

            var blockMinY =
                by - 0.5;

            var blockMaxY =
                by + 0.5;

            var blockMinZ =
                bz - 0.5;

            var blockMaxZ =
                bz + 0.5;

            return (
                playerMaxX >
                    blockMinX + 0.0001 &&
                playerMinX <
                    blockMaxX - 0.0001 &&

                playerMaxY >
                    blockMinY + 0.0001 &&
                playerMinY <
                    blockMaxY - 0.0001 &&

                playerMaxZ >
                    blockMinZ + 0.0001 &&
                playerMinZ <
                    blockMaxZ - 0.0001
            );
        }

        function horizontalCollision(
            px,
            py,
            pz
        ) {

            var half =
                PLAYER_WIDTH / 2;

            var minX =
                Math.floor(
                    px - half
                ) - 1;

            var maxX =
                Math.floor(
                    px + half
                ) + 1;

            var minY =
                Math.floor(
                    py
                ) - 1;

            var maxY =
                Math.floor(
                    py +
                    PLAYER_HEIGHT
                ) + 1;

            var minZ =
                Math.floor(
                    pz - half
                ) - 1;

            var maxZ =
                Math.floor(
                    pz + half
                ) + 1;

            for (
                var x = minX;
                x <= maxX;
                x++
            ) {

                for (
                    var y = minY;
                    y <= maxY;
                    y++
                ) {

                    for (
                        var z = minZ;
                        z <= maxZ;
                        z++
                    ) {

                        if (
                            !isSolid(
                                x,
                                y,
                                z
                            )
                        ) {
                            continue;
                        }

                        if (
                            overlapsPlayerBlock(
                                px,
                                py,
                                pz,
                                x,
                                y,
                                z
                            )
                        ) {

                            return true;
                        }
                    }
                }
            }

            return false;
        }

        function findGround(
            px,
            pz,
            oldY,
            newY
        ) {

            var half =
                PLAYER_WIDTH / 2;

            var minX =
                Math.floor(
                    px - half
                ) - 1;

            var maxX =
                Math.floor(
                    px + half
                ) + 1;

            var minZ =
                Math.floor(
                    pz - half
                ) - 1;

            var maxZ =
                Math.floor(
                    pz + half
                ) + 1;

            var bestY = null;

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

                    var blockXMin =
                        x - 0.5;

                    var blockXMax =
                        x + 0.5;

                    var playerMinX =
                        px - half;

                    var playerMaxX =
                        px + half;

                    if (
                        playerMaxX <=
                        blockXMin ||
                        playerMinX >=
                        blockXMax
                    ) {
                        continue;
                    }

                    var block =
                        getBlock(
                            x,
                            0,
                            z
                        );

                    for (
                        var y =
                            Math.floor(
                                newY
                            ) - 2;
                        y <=
                            Math.floor(
                                oldY
                            ) + 2;
                        y++
                    ) {

                        if (
                            !isSolid(
                                x,
                                y,
                                z
                            )
                        ) {
                            continue;
                        }

                        var top =
                            y + 0.5;

                        if (
                            oldY >=
                                top - 0.05 &&
                            newY <=
                                top + 0.001
                        ) {

                            if (
                                bestY === null ||
                                top > bestY
                            ) {

                                bestY =
                                    top;
                            }
                        }
                    }
                }
            }

            return bestY;
        }

        function findCeiling(
            px,
            pz,
            oldY,
            newY
        ) {

            var half =
                PLAYER_WIDTH / 2;

            var minX =
                Math.floor(
                    px - half
                ) - 1;

            var maxX =
                Math.floor(
                    px + half
                ) + 1;

            var minZ =
                Math.floor(
                    pz - half
                ) - 1;

            var maxZ =
                Math.floor(
                    pz + half
                ) + 1;

            var oldHead =
                oldY +
                PLAYER_HEIGHT;

            var newHead =
                newY +
                PLAYER_HEIGHT;

            var best =
                null;

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

                    for (
                        var y =
                            Math.floor(
                                oldHead
                            ) - 1;
                        y <=
                            Math.floor(
                                newHead
                            ) + 1;
                        y++
                    ) {

                        if (
                            !isSolid(
                                x,
                                y,
                                z
                            )
                        ) {
                            continue;
                        }

                        var bottom =
                            y - 0.5;

                        if (
                            oldHead <=
                                bottom + 0.05 &&
                            newHead >=
                                bottom
                        ) {

                            if (
                                best === null ||
                                bottom < best
                            ) {

                                best =
                                    bottom;
                            }
                        }
                    }
                }
            }

            return best;
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

            if (keys["KeyW"]) {
                forward += 1;
            }

            if (keys["KeyS"]) {
                forward -= 1;
            }

            if (keys["KeyD"]) {
                right += 1;
            }

            if (keys["KeyA"]) {
                right -= 1;
            }

            var length =
                Math.sqrt(
                    forward * forward +
                    right * right
                );

            if (length > 0) {

                forward /= length;
                right /= length;

                var sin =
                    Math.sin(yaw);

                var cos =
                    Math.cos(yaw);

                var moveX =
                    (-sin * forward) +
                    (cos * right);

                var moveZ =
                    (-cos * forward) +
                    (-sin * right);

                player.vx =
                    moveX * MOVE_SPEED;

                player.vz =
                    moveZ * MOVE_SPEED;

            } else {

                player.vx = 0;
                player.vz = 0;
            }

            var newX =
                player.x +
                player.vx * dt;

            if (
                !horizontalCollision(
                    newX,
                    player.y,
                    player.z
                )
            ) {

                player.x = newX;
            }

            var newZ =
                player.z +
                player.vz * dt;

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

            if (inventoryOpen) {
                return;
            }

            var oldY =
                player.y;

            player.vy -=
                GRAVITY * dt;

            var newY =
                player.y +
                player.vy * dt;

            if (player.vy <= 0) {

                var ground =
                    findGround(
                        player.x,
                        player.z,
                        oldY,
                        newY
                    );

                if (
                    ground !== null
                ) {

                    player.y =
                        ground + 0.001;

                    player.vy = 0;

                    player.grounded =
                        true;

                } else {

                    player.y =
                        newY;

                    player.grounded =
                        false;
                }

            } else {

                var ceiling =
                    findCeiling(
                        player.x,
                        player.z,
                        oldY,
                        newY
                    );

                if (
                    ceiling !== null
                ) {

                    player.y =
                        ceiling -
                        PLAYER_HEIGHT -
                        0.001;

                    player.vy = 0;

                } else {

                    player.y =
                        newY;
                }

                player.grounded =
                    false;
            }

            /* Emergency recovery */

            if (
                player.y < -20
            ) {

                player.x = 0;
                player.z = 0;

                player.y =
                    terrainHeight(
                        0,
                        0
                    ) + 0.501;

                player.vy = 0;

                player.grounded =
                    false;
            }

            camera.position.set(
                player.x,
                player.y + PLAYER_EYE,
                player.z
            );
        }

        /* =========================
           INVENTORY
        ========================= */

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

        var inventoryOpen = false;

        /* =========================
           HOTBAR
        ========================= */

        var hotbar =
            document.createElement(
                "div"
            );

        hotbar.style.position =
            "fixed";

        hotbar.style.bottom =
            "15px";

        hotbar.style.left =
            "50%";

        hotbar.style.transform =
            "translateX(-50%)";

        hotbar.style.display =
            "flex";

        hotbar.style.gap =
            "5px";

        hotbar.style.zIndex =
            "20";

        document.body.appendChild(
            hotbar
        );

        function updateHotbar() {

            hotbar.innerHTML = "";

            blockNames.forEach(
                function (
                    name,
                    index
                ) {

                    var slot =
                        document.createElement(
                            "div"
                        );

                    slot.style.width =
                        "52px";

                    slot.style.height =
                        "52px";

                    slot.style.background =
                        "rgba(0,0,0,0.65)";

                    slot.style.border =
                        index === selectedSlot
                            ? "3px solid white"
                            : "2px solid #777";

                    slot.style.boxSizing =
                        "border-box";

                    slot.style.position =
                        "relative";

                    var image =
                        document.createElement(
                            "img"
                        );

                    image.src =
                        "textures/" +
                        BLOCKS[name].texture;

                    image.style.width =
                        "100%";

                    image.style.height =
                        "100%";

                    image.style.imageRendering =
                        "pixelated";

                    slot.appendChild(
                        image
                    );

                    var number =
                        document.createElement(
                            "span"
                        );

                    number.textContent =
                        String(index + 1);

                    number.style.position =
                        "absolute";

                    number.style.left =
                        "3px";

                    number.style.top =
                        "2px";

                    number.style.color =
                        "white";

                    number.style.font =
                        "bold 12px Arial";

                    slot.appendChild(
                        number
                    );

                    var amount =
                        document.createElement(
                            "span"
                        );

                    amount.textContent =
                        String(
                            inventory[name] ||
                            0
                        );

                    amount.style.position =
                        "absolute";

                    amount.style.right =
                        "3px";

                    amount.style.bottom =
                        "2px";

                    amount.style.color =
                        "white";

                    amount.style.font =
                        "bold 12px Arial";

                    slot.appendChild(
                        amount
                    );

                    slot.onclick =
                        function () {

                            selectedSlot =
                                index;

                            updateHotbar();
                            updateInventory();
                        };

                    hotbar.appendChild(
                        slot
                    );
                }
            );
        }

        updateHotbar();

        /* =========================
           INVENTORY UI
        ========================= */

        var inventoryPanel =
            document.createElement(
                "div"
            );

        inventoryPanel.style.position =
            "fixed";

        inventoryPanel.style.left =
            "50%";

        inventoryPanel.style.top =
            "50%";

        inventoryPanel.style.transform =
            "translate(-50%,-50%)";

        inventoryPanel.style.background =
            "rgba(25,25,25,0.96)";

        inventoryPanel.style.padding =
            "20px";

        inventoryPanel.style.border =
            "3px solid white";

        inventoryPanel.style.display =
            "none";

        inventoryPanel.style.gridTemplateColumns =
            "repeat(4,80px)";

        inventoryPanel.style.gap =
            "10px";

        inventoryPanel.style.zIndex =
            "30";

        document.body.appendChild(
            inventoryPanel
        );

        function updateInventory() {

            inventoryPanel.innerHTML =
                "";

            blockNames.forEach(
                function (
                    name,
                    index
                ) {

                    var slot =
                        document.createElement(
                            "div"
                        );

                    slot.style.width =
                        "80px";

                    slot.style.height =
                        "80px";

                    slot.style.background =
                        "rgba(0,0,0,0.7)";

                    slot.style.border =
                        index === selectedSlot
                            ? "3px solid yellow"
                            : "2px solid #777";

                    slot.style.position =
                        "relative";

                    slot.style.cursor =
                        "pointer";

                    var img =
                        document.createElement(
                            "img"
                        );

                    img.src =
                        "textures/" +
                        BLOCKS[name].texture;

                    img.style.width =
                        "100%";

                    img.style.height =
                        "100%";

                    img.style.imageRendering =
                        "pixelated";

                    slot.appendChild(
                        img
                    );

                    var label =
                        document.createElement(
                            "div"
                        );

                    label.textContent =
                        BLOCKS[name].name;

                    label.style.position =
                        "absolute";

                    label.style.left =
                        "3px";

                    label.style.top =
                        "3px";

                    label.style.color =
                        "white";

                    label.style.font =
                        "bold 11px Arial";

                    slot.appendChild(
                        label
                    );

                    var count =
                        document.createElement(
                            "div"
                        );

                    count.textContent =
                        String(
                            inventory[name] ||
                            0
                        );

                    count.style.position =
                        "absolute";

                    count.style.right =
                        "4px";

                    count.style.bottom =
                        "3px";

                    count.style.color =
                        "white";

                    count.style.font =
                        "bold 14px Arial";

                    slot.appendChild(
                        count
                    );

                    slot.onclick =
                        function () {

                            selectedSlot =
                                index;

                            updateHotbar();
                            updateInventory();
                        };

                    inventoryPanel.appendChild(
                        slot
                    );
                }
            );
        }

        function toggleInventory() {

            inventoryOpen =
                !inventoryOpen;

            if (inventoryOpen) {

                inventoryPanel.style.display =
                    "grid";

                if (
                    document.pointerLockElement
                ) {

                    document.exitPointerLock();
                }

                updateInventory();

            } else {

                inventoryPanel.style.display =
                    "none";
            }
        }

        /* =========================
           CROSSHAIR
        ========================= */

        var crosshair =
            document.createElement(
                "div"
            );

        crosshair.textContent =
            "+";

        crosshair.style.position =
            "fixed";

        crosshair.style.left =
            "50%";

        crosshair.style.top =
            "50%";

        crosshair.style.transform =
            "translate(-50%,-50%)";

        crosshair.style.color =
            "white";

        crosshair.style.font =
            "bold 28px Arial";

        crosshair.style.pointerEvents =
            "none";

        crosshair.style.zIndex =
            "10";

        document.body.appendChild(
            crosshair
        );

        /* =========================
           TARGETING
        ========================= */

        var raycaster =
            new THREE.Raycaster();

        var center =
            new THREE.Vector2(
                0,
                0
            );

        var targetBlock = null;

        function findTarget() {

            targetBlock = null;

            raycaster.setFromCamera(
                center,
                camera
            );

            var objects = [];

            blockNames.forEach(
                function (name) {

                    if (
                        meshes[name]
                    ) {

                        objects.push(
                            meshes[name]
                        );
                    }
                }
            );

            var hits =
                raycaster.intersectObjects(
                    objects,
                    false
                );

            if (
                hits.length === 0
            ) {
                return;
            }

            var hit =
                hits[0];

            if (
                hit.distance > REACH
            ) {
                return;
            }

            var mesh =
                hit.object;

            var type =
                mesh.userData.blockType;

            if (!type) {
                return;
            }

            var instance =
                hit.instanceId;

            if (
                instance === undefined ||
                instance === null
            ) {
                return;
            }

            var block =
                mesh.userData.blocks[
                    instance
                ];

            if (!block) {
                return;
            }

            targetBlock = {

                block: block,

                normal:
                    hit.face.normal.clone()
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

        highlight.visible =
            false;

        scene.add(
            highlight
        );

        function updateHighlight() {

            if (inventoryOpen) {

                highlight.visible =
                    false;

                return;
            }

            findTarget();

            if (!targetBlock) {

                highlight.visible =
                    false;

                return;
            }

            var block =
                targetBlock.block;

            highlight.position.set(
                block.x,
                block.y,
                block.z
            );

            highlight.visible =
                true;
        }

        /* =========================
           BREAK / PLACE
        ========================= */

        function rebuildWorld() {

            buildWorldMeshes();
        }

        renderer.domElement.addEventListener(
            "mousedown",
            function (event) {

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

                findTarget();

                if (!targetBlock) {
                    return;
                }

                var block =
                    targetBlock.block;

                /* LEFT CLICK - BREAK */

                if (
                    event.button === 0
                ) {

                    removeBlock(
                        block.x,
                        block.y,
                        block.z
                    );

                    inventory[
                        block.type
                    ] =
                        (
                            inventory[
                                block.type
                            ] || 0
                        ) + 1;

                    rebuildWorld();

                    updateHotbar();
                    updateInventory();

                    return;
                }

                /* RIGHT CLICK - PLACE */

                if (
                    event.button === 2
                ) {

                    var selected =
                        blockNames[
                            selectedSlot
                        ];

                    if (
                        !selected
                    ) {
                        return;
                    }

                    if (
                        (
                            inventory[
                                selected
                            ] || 0
                        ) <= 0
                    ) {
                        return;
                    }

                    var normal =
                        targetBlock.normal;

                    var px =
                        block.x +
                        Math.round(
                            normal.x
                        );

                    var py =
                        block.y +
                        Math.round(
                            normal.y
                        );

                    var pz =
                        block.z +
                        Math.round(
                            normal.z
                        );

                    if (
                        getBlock(
                            px,
                            py,
                            pz
                        )
                    ) {
                        return;
                    }

                    /* Don't place inside player */

                    if (
                        overlapsPlayerBlock(
                            player.x,
                            player.y,
                            player.z,
                            px,
                            py,
                            pz
                        )
                    ) {
                        return;
                    }

                    addBlock(
                        px,
                        py,
                        pz,
                        selected
                    );

                    inventory[
                        selected
                    ]--;

                    rebuildWorld();

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
                        window.devicePixelRatio ||
                            1,
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

            requestAnimationFrame(
                animate
            );

            var dt =
                (now - lastTime) /
                1000;

            lastTime = now;

            if (
                dt > 0.05
            ) {
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

        animate(
            performance.now()
        );
    }

    startGame();

})();
