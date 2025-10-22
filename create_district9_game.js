// ===========================
// District 9 – Interactive Fixed Edition (Final Polished Version + Delivery Dialogue Expansion)
// ===========================

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
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

const droneVisitMessages = [
    "Drone: Routine area scan complete.",
    "Drone: Local humidity 43%.",
    "Drone: Visual confirmation received.",
    "Drone: All systems stable.",
    "Drone: Continuing patrol to next sector."
];

// ===========================
// Drone Delivery Dialogue (新增送食物 NPC 对话)
// ===========================
const npcDialoguesDelivery = [
    "Resident: I ordered some food earlier… Oh, it’s here already! Getting food in District 9 has never been this easy.",
    "Resident: The drone arrived just in time — no more waiting in lines like before.",
    "Resident: Incredible! It took only ten minutes for my meal to fly over from the hub.",
    "Resident: The drone just dropped my lunch. Life feels more efficient, yet somehow quieter now.",
    "Resident: They say technology isolates people, but honestly, this drone just saved me an hour.",
    "Resident: I used to walk blocks to find groceries. Now they just appear from the sky.",
    "Resident: It’s strange… the food is still warm, but there’s no delivery person to thank anymore."
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

    // Player’s following drone
    droneFollow = this.physics.add.sprite(player.x, player.y - 50, "drone").setScale(0.4);
    droneFollow.body.allowGravity = false;

    // === NPC Distribution ===
    npcs = this.physics.add.group();

    // ✅ Delivery NPCs (left-top green park, lowered slightly)
    const deliveryNPCs = [
        [210, 170], [270, 200], [320, 250], [400, 220]
    ];

    // ✅ Visiting NPCs (right mid area)
    const visitNPCs = [
        [550, 420], [600, 340], [640, 400], [700, 380], [720, 470], [760, 430]
    ];

    // ✅ Other random NPCs (spread across city)
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

    // === Textbox ===
    textBox = this.add.text(40, 580, "", {
        fontSize: "18px",
        fill: "#fff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 10, y: 6 },
        wordWrap: { width: 880 }
    });

    // === Keyboard Control ===
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeys("W,S,A,D,SPACE");

    // === Overlap Trigger (Detection only) ===
    this.physics.add.overlap(player, npcs, handleProximity, null, this);

    // === Virtual Joystick ===
    createVirtualControls(this);
}

// ===========================
// Update
// ===========================
function update() {
    const speed = 140;
    player.setVelocity(0);

    // Movement
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

    // Drone follow player
    droneFollow.x = Phaser.Math.Linear(droneFollow.x, player.x, 0.1);
    droneFollow.y = Phaser.Math.Linear(droneFollow.y, player.y - 50, 0.1);
}

// ===========================
// Handle NPC Proximity (Press Key to Interact)
// ===========================
function handleProximity(player, npc) {
    const distance = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);

    // Press SPACE or Action Button to interact when close enough
    if (distance < 70 && (Phaser.Input.Keyboard.JustDown(cursors.space) || actionTriggered) && !npcTextVisible) {
        npcTextVisible = true;
        actionTriggered = false; // reset

        if (npc.isDelivery) {
            const msg = npcDialoguesDelivery[Phaser.Math.Between(0, npcDialoguesDelivery.length - 1)];
            textBox.setText(msg);
            spawnDeliveryDrone(player.scene, npc);
        } else if (npc.isVisit) {
            const msg = droneVisitMessages[Phaser.Math.Between(0, droneVisitMessages.length - 1)];
            textBox.setText(msg);
            spawnVisitDrone(player.scene, npc);
        } else {
            const pool = Phaser.Math.Between(0, 1) === 0 ? npcDialoguesPositive : npcDialoguesNegative;
            textBox.setText(pool[Phaser.Math.Between(0, pool.length - 1)]);
        }

        // 点击或空格关闭
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

    // 飞入 → 精确降落在 NPC 前方
    scene.tweens.add({
        targets: [drone, fruits],
        x: npc.x,
        duration: 2200,
        ease: "Sine.easeInOut",
        onComplete: () => {
            // 垂直下降
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
// Virtual Controls (iPad)
// ===========================
let joystickBase, joystickThumb, actionBtn, joystickActive = false, joystickStart = {};

function createVirtualControls(scene) {
    joystickBase = scene.add.image(120, 520, "joystickBase").setAlpha(0);
    joystickThumb = scene.add.image(120, 520, "joystickThumb").setAlpha(0);
    actionBtn = scene.add.image(830, 520, "actionBtn").setAlpha(0);

    scene.input.on("pointerdown", (pointer) => {
        if (pointer.x < 300) {
            joystickBase.setPosition(pointer.x, pointer.y).setAlpha(0.6);
            joystickThumb.setPosition(pointer.x, pointer.y).setAlpha(0.8);
            joystickActive = true;
            joystickStart = { x: pointer.x, y: pointer.y };
        } else if (pointer.x > 700) {
            actionBtn.setPosition(pointer.x, pointer.y).setAlpha(0.8);
            // ✅ 触发交互动作
            actionTriggered = true;
        }
    });

    scene.input.on("pointerup", () => {
        joystickActive = false;
        joystickBase.setAlpha(0);
        joystickThumb.setAlpha(0);
        actionBtn.setAlpha(0);
        actionTriggered = false;
    });
}

new Phaser.Game(config);
