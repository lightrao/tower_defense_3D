// js/main.js
import * as THREE from 'three';
import { Path } from './Path.js';
import { Enemy } from './Enemy.js';
import { Tower } from './Tower.js';
import { WaveManager } from './WaveManager.js'; // Import WaveManager
import { Projectile } from './Projectile.js'; // Import Projectile

// --- Game State ---
let playerGold = 100; // Starting gold
let playerLives = 20; // Starting lives
let currentWaveNumber = 0;
let gameStatus = 'IDLE'; // IDLE, WAVE_ACTIVE, WAVE_COMPLETE, GAME_OVER, GAME_WON
let waveManager;
let selectedTower = null; // For upgrade UI
let animationFrameId; // To store the requestAnimationFrame ID

const towers = []; // Array to hold tower instances
let buildMode = false; // Flag to indicate if player is trying to place a tower
const projectiles = []; // Array to hold active projectile instances
const BASIC_TOWER_COST = 50;
const groundRaycastPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // For raycasting, assuming ground is at y=0
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// --- Basic Setup ---
const canvas = document.getElementById('game-canvas');
if (!canvas) {
    console.error("Error: Canvas element #game-canvas not found!");
    throw new Error("Canvas not found"); // Stop execution if canvas is missing
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 15, 12); // Adjusted camera position for better view
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Ground Plane ---
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = 0;
groundMesh.name = 'ground';
scene.add(groundMesh);

// --- Path Definition & Visualization ---
const path = new Path();
const pathVisual = path.createPathVisual();
scene.add(pathVisual);

// --- Enemy Management ---
const clock = new THREE.Clock();
const enemies = []; // This will be populated by WaveManager

// --- Initialize Wave Manager ---
// Ensure scene, path, and enemies array are defined before this
waveManager = new WaveManager(scene, path, enemies);

// --- UI Elements ---
const goldDisplay = document.getElementById('gold-display');
const buildTurretButton = document.getElementById('build-turret-button');
const buildFeedback = document.getElementById('build-feedback');
const livesDisplay = document.getElementById('lives-display');
const waveDisplay = document.getElementById('wave-display');
const startWaveButton = document.getElementById('start-wave-button');
const gameStatusDisplay = document.getElementById('game-status');
const upgradeUI = document.getElementById('upgrade-ui');
const upgradeLevelDisplay = document.getElementById('upgrade-level');
const upgradeCostDisplay = document.getElementById('upgrade-cost');
const upgradeButton = document.getElementById('upgrade-button');
const closeUpgradeButton = document.getElementById('close-upgrade-button');

// --- UI Update Function ---
function updateUI() {
    if (goldDisplay) goldDisplay.textContent = playerGold;
    if (livesDisplay) livesDisplay.textContent = playerLives;
    if (waveDisplay) waveDisplay.textContent = currentWaveNumber > 0 ? currentWaveNumber : '-';

    if (buildFeedback) buildFeedback.textContent = buildMode ? 'Click on the ground to place tower.' : '';
    if (buildTurretButton) buildTurretButton.disabled = playerGold < BASIC_TOWER_COST || buildMode || gameStatus === 'GAME_OVER' || gameStatus === 'GAME_WON';

    if (startWaveButton) {
        startWaveButton.disabled = !(gameStatus === 'IDLE' || gameStatus === 'WAVE_COMPLETE');
        startWaveButton.textContent = currentWaveNumber === 0 ? 'Start First Wave' : 'Start Next Wave';
        if (gameStatus === 'GAME_OVER' || gameStatus === 'GAME_WON') {
             startWaveButton.disabled = true;
        }
    }

    if (gameStatusDisplay) {
        if (gameStatus === 'GAME_OVER') gameStatusDisplay.textContent = 'GAME OVER!';
        else if (gameStatus === 'GAME_WON') gameStatusDisplay.textContent = 'YOU WIN!';
        else gameStatusDisplay.textContent = '';
    }

    if (upgradeUI) {
        if (selectedTower && gameStatus !== 'GAME_OVER' && gameStatus !== 'GAME_WON') {
            upgradeLevelDisplay.textContent = selectedTower.level;
            const cost = selectedTower.getUpgradeCost();
            upgradeCostDisplay.textContent = cost;
            upgradeButton.disabled = playerGold < cost;
            upgradeUI.style.display = 'block';
        } else {
            upgradeUI.style.display = 'none';
        }
    }
}

// --- Event Listeners ---

// Build Turret Button
if (buildTurretButton) {
    buildTurretButton.addEventListener('click', () => {
        if (playerGold >= BASIC_TOWER_COST && !buildMode && gameStatus !== 'GAME_OVER' && gameStatus !== 'GAME_WON') {
            buildMode = true;
            selectedTower = null; // Deselect tower when entering build mode
            updateUI();
        } else if (playerGold < BASIC_TOWER_COST) {
            if (buildFeedback) buildFeedback.textContent = 'Not enough gold!';
        }
    });
} else { console.error("Build Turret button not found!"); }

// Start Wave Button
if (startWaveButton) {
    startWaveButton.addEventListener('click', () => {
        if (gameStatus === 'IDLE' || gameStatus === 'WAVE_COMPLETE') {
            const waveResult = waveManager.startNextWave();
            if (waveResult === 'WAVE_STARTED') {
                gameStatus = 'WAVE_ACTIVE';
                currentWaveNumber = waveManager.getCurrentWaveNumber();
                console.log(`Wave ${currentWaveNumber} started.`);
            } else if (waveResult === 'GAME_WON') {
                gameStatus = 'GAME_WON';
                console.log("Game Won!");
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
            }
            updateUI();
        }
    });
} else { console.error("Start Wave button not found!"); }

// Canvas Click (Build OR Select Tower)
if (canvas) {
    canvas.addEventListener('pointerdown', (event) => {
        if (gameStatus === 'GAME_OVER' || gameStatus === 'GAME_WON') return; // Ignore clicks if game ended

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        if (buildMode) {
            // Build Mode Logic
            const groundObject = scene.getObjectByName('ground');
            if (!groundObject) {
                console.error("Ground mesh not found."); buildMode = false; updateUI(); return;
            }
            const intersects = raycaster.intersectObject(groundObject);
            if (intersects.length > 0) {
                const intersectPoint = intersects[0].point;
                if (playerGold >= BASIC_TOWER_COST) {
                    playerGold -= BASIC_TOWER_COST;
                    const towerPosition = new THREE.Vector3(intersectPoint.x, 0, intersectPoint.z);
                    const towerConfig = { cost: BASIC_TOWER_COST, color: 0xffa500, range: 6, damage: 30, fireRate: 1.2 }; // Increased base damage from 15 to 30
                    const newTower = new Tower(towerPosition, scene, projectiles, towerConfig); // Pass scene AND projectiles array
                    towers.push(newTower);
                    buildMode = false;
                    updateUI();
                    console.log('Placed tower at:', towerPosition.x.toFixed(1), towerPosition.z.toFixed(1));
                } else {
                    if (buildFeedback) buildFeedback.textContent = 'Not enough gold!';
                    buildMode = false; updateUI();
                }
            } else {
                 if (buildFeedback) buildFeedback.textContent = 'Click on the ground plane.';
            }
        } else {
            // Selection Mode Logic
            const towerMeshes = towers.map(t => t.mesh);
            const intersects = raycaster.intersectObjects(towerMeshes);
            if (intersects.length > 0) {
                const clickedTowerMesh = intersects[0].object;
                if (clickedTowerMesh.userData.towerInstance) {
                    selectedTower = clickedTowerMesh.userData.towerInstance;
                    console.log("Selected Tower:", selectedTower);
                    updateUI();
                } else {
                    console.warn("Clicked tower mesh missing towerInstance.");
                    selectedTower = null; updateUI();
                }
            } else {
                // Clicked empty space - deselect
                selectedTower = null; updateUI();
            }
        }
    });
} else { console.error("Canvas element not found for pointerdown listener!"); }

// Upgrade Button
if (upgradeButton) {
    upgradeButton.addEventListener('click', () => {
        if (selectedTower && gameStatus !== 'GAME_OVER' && gameStatus !== 'GAME_WON') {
            const cost = selectedTower.getUpgradeCost();
            if (playerGold >= cost) {
                playerGold -= cost;
                selectedTower.upgrade();
                console.log("Tower upgraded!");
                updateUI(); // Update gold and panel info
            } else {
                console.log("Not enough gold to upgrade.");
                // Optional feedback
                if (gameStatusDisplay) {
                    gameStatusDisplay.textContent = "Not enough gold!";
                    setTimeout(() => { if (gameStatus !== 'GAME_OVER' && gameStatus !== 'GAME_WON') gameStatusDisplay.textContent = ''; }, 1500);
                }
            }
        }
    });
} else { console.error("Upgrade button not found!"); }

// Close Upgrade Button
if (closeUpgradeButton) {
    closeUpgradeButton.addEventListener('click', () => {
        selectedTower = null;
        updateUI();
    });
} else { console.error("Close Upgrade button not found!"); }


// --- Initial UI Update ---
updateUI();

// --- Animation Loop ---
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (gameStatus === 'GAME_OVER' || gameStatus === 'GAME_WON') {
        return; // Stop updates if game has ended
    }

    const deltaTime = clock.getDelta();

    // 1. Update Wave Manager (spawns enemies)
    const waveStatus = waveManager.update(deltaTime);
    if (waveStatus === 'WAVE_COMPLETE') {
        gameStatus = 'WAVE_COMPLETE';
        console.log("Wave complete, ready for next.");
        updateUI(); // Enable start button
    }

    // 2. Update Towers
    for (const tower of towers) {
        tower.update(deltaTime, enemies);
    }

    // 3. Update Projectiles (iterate backwards for safe removal)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const status = projectile.update(deltaTime);

        if (status === 'HIT_TARGET' || status === 'INVALID_TARGET') {
            projectile.dispose(); // Remove mesh from scene
            projectiles.splice(i, 1); // Remove from array
        }
    }

    // 4. Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update(deltaTime);

        let removeEnemy = false;
        if (enemy.isDead()) {
            playerGold += enemy.value;
            removeEnemy = true;
            // console.log(`Enemy defeated! +${enemy.value}G. Gold: ${playerGold}`); // Less verbose logging
        } else if (enemy.hasReachedEnd()) {
            playerLives--;
            console.log(`Enemy reached end! Lives: ${playerLives}`);
            removeEnemy = true;

            if (playerLives <= 0) {
                playerLives = 0;
                gameStatus = 'GAME_OVER';
                console.log("GAME OVER!");
                cancelAnimationFrame(animationFrameId);
                updateUI();
                return; // Exit loop immediately on game over
            }
        }

        if (removeEnemy) {
            enemy.dispose();
            enemies.splice(i, 1);
        }
    }

    // 4. Update UI (call less frequently if performance is an issue, but needed after gold/lives change)
    updateUI();

    // 5. Render Scene
    renderer.render(scene, camera);
}

// --- Resize Handler ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

// --- Start Animation ---
if (renderer) {
    animate();
} else {
    console.error("Renderer not initialized, cannot start animation loop.");
}