// ===========================
// District 9 – Interactive Final Version (with Smooth Joystick + Delivery Dialogue Variety)
// ===========================

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update },
    scale: {
        mode: Phaser.Scale.NONE, // 桌面固定分辨率
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    banner: false // ✅ 去掉左下角 Phaser 标识
};

let player, droneFollow, cursors, npcs, textBox, bgm;
let npcTextVisible = false;
let actionTriggered = false;

// ===========================
// Dialogues
// ===========================
const npcDialoguesPositive = [
    "Resident: The drones bring fresh fruit every morning now — no more long walks to the market.",
    "Engineer: Solar panels on rooftops reduced blackout times by 80%.",
    "Merchant: Drones deliver faster than any driver — the future arrived overnight.",
    "Nurse: The health pod can diagnose patients in seconds; it saved two lives last week.",
    "Guard: Patrol drones make this area feel safe again.",
    "Operator: Communication signals are more stable since the new uplink was installed."
];

const npcDialoguesNegative = [
    "Resident: The drones don’t see us — they just drop supplies and leave.",
    "Mechanic: We fix what we can, but no one provides parts anymore.",
    "Artist: Even murals are scanned and replaced with ads now.",
    "Reporter: Power keeps fluctuating — the grid’s stretched thin.",
    "Elder: The city hums louder each night; I miss the silence.",
    "Worker: My permit expired — drones won’t let me into my workshop."
];

const deliveryDialogues = [
    "Resident: I ordered some food earlier... It just arrived faster than I could boil water!",
    "Worker: These drones deliver lunch in minutes — eating warm meals feels like a luxury again.",
    "Student: My snacks flew here before I even finished the order form!",
    "Chef: Fresh ingredients now come straight to my doorstep — no need to rush to the market.",
    "Resident: Getting food in this district used to take forever. Now it’s quick and easy.",
    "Shopkeeper: Drone deliveries are so efficient; I almost miss arguing with couriers.",
    "Neighbor: The drones even found my house in the maze of alleys. It’s like magic!"
];

const droneVisitMessages = [
    "Drone: Routine area scan complete.",
    "Drone: Local humidity 43%.",
    "Drone: Visual confirmation received.",
    "Drone: All systems stable.",
    "Drone: Continuing patrol to next sector."
];

// ===========================
// Preload
// ===========================
function preload() {
    this.load.image("map", "./assets/Map/Map.png");
    this.load.image("drone", "./assets/Drone/drone.png");
    this.load.image("hero_front", "./assets/Hero/Hero.front.png");
    this.load.image("hero_back", "./assets/Hero/Hero.back.png");
    this.load.image("hero_left", "./assets/Hero/Hero.left.png");
    this.load.image("hero_right", "./assets/Hero/Hero.right.png");
    this.load.image("fruits", "./assets/Item/fruits.png");

    this.load.image("joystickBase", "./assets/UI/joystick_base.png");
    this.load.image("joystickThumb", "./assets/UI/joystick_thumb.png");
    this.load.image("actionBtn", "./assets/UI/button_interact.png");

    for (let i = 1; i <= 24; i++) this.load.image("npc" + i, `./assets/NPC/npc${i}.png`);
    this.load.audio("bgm", "./assets/BGM/bgm.mp3");
}

// ===========================
// Create
// ===========================
function create() {
    // Map
    this.add.image(480, 320, "map").setScale(0.9);

    // Music
    bgm = this.sound.add("bgm", { loop: true, volume: 0.4 });
    bgm.play();

    // Player
    player = this.physics.add.sprite(480, 500, "hero_front").setScale(0.8);
    player.setCollideWorldBounds(true);

    // Drone follow
    droneFollow = this.physics.add.sprite(player.x, player.y - 50, "drone").setScale(0.4);
    droneFollow.body.allowGravity = false;

    // NPCs
    npcs = this.physics.add.group();
    const deliveryNPCs = [[210, 170], [270, 200], [320, 250], [400, 220]];
    const visitNPCs = [[550, 420], [600, 340], [640, 400], [700, 380], [720, 470], [760, 430]];
    const randomNPCs = [];
    for (let i = 0; i < 14; i++) randomNPCs.push([
        Phaser.Math.Between(150, 850),
        Phaser.Math.Between(270, 570)
    ]);

    [...deliveryNPCs, ...visitNPCs, ...randomNPCs].forEach((pos, i) => {
        const npc = npcs.create(pos[0], pos[1], "npc" + ((i % 24) + 1)).setScale(1);
        npc.isDelivery = i < deliveryNPCs.length;
        npc.isVisit = i >= deliveryNPCs.length && i < deliveryNPCs.length + visitNPCs.length;
    });

    // Textbox
    textBox = this.add.text(40, 580, "", {
        fontSize: "18px",
        fill: "#fff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 10, y: 6 },
        wordWrap: { width: 880 }
    });

    // Keyboard
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeys("W,S,A,D,SPACE");

    // Overlap trigger
    this.physics.add.overlap(player, npcs, handleProximity, null, this);

    // ✅ 虚拟摇杆
    createVirtualControls(this);
}

// ===========================
// Update
// ===========================
function update() {
    const speed = 140;
    player.setVelocity(0);

    if (cursors.left.isDown || this.input.keyboard.keys[65].isDown) {
        player.setVelocityX(-speed);
        player.setTexture("hero_left");
    } else if (cursors.right.isDown || this.input.keyboard.keys[68].isDown) {
        player.setVelocityX(speed);
        player.setTexture("hero_right");
    } else if (cursors.up.isDown || this.input.keyboard.keys[87].isDown) {
        player.setVelocityY(-speed);
        player.setTexture("hero_back");
    } else if (cursors.down.isDown || this.input.keyboard.keys[83].isDown) {
        player.setVelocityY(speed);
        player.setTexture("hero_front");
    }

    // Drone follow
    droneFollow.x = Phaser.Math.Linear(droneFollow.x, player.x, 0.1);
    droneFollow.y = Phaser.Math.Linear(droneFollow.y, player.y - 50, 0.1);
}

// ===========================
// Handle NPC Interaction
// ===========================
function handleProximity(player, npc) {
    const distance = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
    if (distance < 70 && (Phaser.Input.Keyboard.JustDown(cursors.space) || actionTriggered) && !npcTextVisible) {
        npcTextVisible = true;
        actionTriggered = false;

        if (npc.isDelivery) {
            const randomLine = deliveryDialogues[Phaser.Math.Between(0, deliveryDialogues.length - 1)];
            textBox.setText(randomLine);
            spawnDeliveryDrone(player.scene, npc);
        } else if (npc.isVisit) {
            const msg = droneVisitMessages[Phaser.Math.Between(0, droneVisitMessages.length - 1)];
            textBox.setText(msg);
            spawnVisitDrone(player.scene, npc);
        } else {
            const pool = Phaser.Math.Between(0, 1) === 0 ? npcDialoguesPositive : npcDialoguesNegative;
            textBox.setText(pool[Phaser.Math.Between(0, pool.length - 1)]);
        }

        player.scene.input.once("pointerdown", () => {
            textBox.setText("");
            npcTextVisible = false;
        });
        player.scene.input.keyboard.once("keydown-SPACE", () => {
            textBox.setText("");
            npcTextVisible = false;
        });
    }
}

// ===========================
// Drone Delivery Animation
// ===========================
function spawnDeliveryDrone(scene, npc) {
    const drone = scene.add.sprite(-150, npc.y - 150, "drone").setScale(0.3);
    const fruits = scene.add.sprite(-150, npc.y - 120, "fruits").setScale(0.8);

    scene.tweens.add({
        targets: [drone, fruits],
        x: npc.x,
        duration: 2200,
        ease: "Sine.easeInOut",
        onComplete: () => {
            scene.tweens.add({
                targets: [drone, fruits],
                y: npc.y - 20,
                duration: 1000,
                ease: "Sine.easeInOut",
                onComplete: () => {
                    textBox.setText("Drone: Delivery confirmed.");
                    scene.time.delayedCall(4000, () => {
                        fruits.destroy();
                        scene.tweens.add({
                            targets: drone,
                            x: 1100,
                            y: npc.y - 150,
                            duration: 2500,
                            ease: "Sine.easeInOut",
                            onComplete: () => drone.destroy()
                        });
                    });
                }
            });
        }
    });
}

// ===========================
// Drone Visit Animation
// ===========================
function spawnVisitDrone(scene, npc) {
    const drone = scene.add.sprite(1100, npc.y - 120, "drone").setScale(0.3);
    scene.tweens.add({
        targets: drone,
        x: npc.x,
        duration: 2000,
        ease: "Sine.easeInOut",
        onComplete: () => {
            scene.time.delayedCall(4000, () => {
                scene.tweens.add({
                    targets: drone,
                    x: -150,
                    duration: 2000,
                    ease: "Sine.easeInOut",
                    onComplete: () => drone.destroy()
                });
            });
        }
    });
}

// ===========================
// ✅ 改进版虚拟摇杆（流畅 + 圆形范围锁定）
// ===========================
let joystickBase, joystickThumb, actionBtn;
let joystickActive = false;
let joystickStart = { x: 0, y: 0 };
let joystickRadius = 60;
let pointerId = null;

function createVirtualControls(scene) {
    joystickBase = scene.add.image(120, 520, "joystickBase").setAlpha(0);
    joystickThumb = scene.add.image(120, 520, "joystickThumb").setAlpha(0);
    actionBtn = scene.add.image(830, 520, "actionBtn").setAlpha(0);
    scene.input.addPointer(3);

    scene.input.on("pointerdown", (pointer) => {
        if (pointer.x < scene.scale.width / 2 && pointerId === null) {
            joystickBase.setPosition(pointer.x, pointer.y).setAlpha(0.6);
            joystickThumb.setPosition(pointer.x, pointer.y).setAlpha(0.9);
            joystickActive = true;
            joystickStart = { x: pointer.x, y: pointer.y };
            pointerId = pointer.id;
        } else if (pointer.x > scene.scale.width / 2) {
            actionBtn.setPosition(pointer.x, pointer.y).setAlpha(0.8);
            actionTriggered = true;
        }
    });

    scene.input.on("pointermove", (pointer) => {
        if (!joystickActive || pointer.id !== pointerId) return;

        const dx = pointer.x - joystickStart.x;
        const dy = pointer.y - joystickStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const clampedDist = Math.min(dist, joystickRadius);
        const thumbX = joystickStart.x + Math.cos(angle) * clampedDist;
        const thumbY = joystickStart.y + Math.sin(angle) * clampedDist;
        joystickThumb.setPosition(thumbX, thumbY);

        const normalizedX = dx / joystickRadius;
        const normalizedY = dy / joystickRadius;
        const moveSpeed = 150;

        player.setVelocity(normalizedX * moveSpeed, normalizedY * moveSpeed);

        if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
            player.setTexture(normalizedX > 0 ? "hero_right" : "hero_left");
        } else {
            player.setTexture(normalizedY > 0 ? "hero_front" : "hero_back");
        }
    });

    scene.input.on("pointerup", (pointer) => {
        if (pointer.id === pointerId) {
            joystickActive = false;
            joystickBase.setAlpha(0);
            joystickThumb.setAlpha(0);
            pointerId = null;
            player.setVelocity(0);
        }
        actionBtn.setAlpha(0);
        actionTriggered = false;
    });
}

new Phaser.Game(config);
