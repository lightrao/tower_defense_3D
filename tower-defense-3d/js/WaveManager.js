// js/WaveManager.js
import { Enemy } from './Enemy.js';

// Define basic enemy configurations (adjust as needed)
const ENEMY_CONFIGS = {
    'standard': { health: 100, speed: 1.5, value: 10, color: 0xff0000, size: 0.5 },
    'fast': { health: 50, speed: 3.0, value: 8, color: 0xffff00, size: 0.4 },
    'tough': { health: 250, speed: 1.0, value: 20, color: 0x0000ff, size: 0.7 }
};

export class WaveManager {
    constructor(scene, path, enemiesArray) {
        this.scene = scene;
        this.path = path;
        this.enemiesArray = enemiesArray; // Reference to the main enemies array

        // Define wave configurations
        this.waveConfigs = [
            { // Wave 1
                enemies: [
                    { type: 'standard', count: 5, interval: 1.0 }
                ],
                delay: 3.0 // Delay before this wave can be started (optional, could be handled by button)
            },
            { // Wave 2
                enemies: [
                    { type: 'standard', count: 8, interval: 0.8 },
                    { type: 'fast', count: 3, interval: 1.5 } // Spawn fast ones slightly spaced out
                ],
                delay: 5.0
            },
            { // Wave 3
                enemies: [
                    { type: 'tough', count: 2, interval: 2.0 },
                    { type: 'standard', count: 10, interval: 0.5 },
                    { type: 'fast', count: 5, interval: 0.7 }
                ],
                delay: 5.0
            }
            // Add more waves as needed
        ];

        this.currentWaveIndex = -1;
        this.spawnTimer = 0;
        this.enemiesToSpawn = []; // Will hold copies of config like { type: 'standard', count: 5, interval: 1.0 }
        this.activeWave = false;
        this.timeUntilNextWave = 0; // Could be used for auto-starting waves later
    }

    startNextWave() {
        if (this.activeWave) {
            console.warn("Cannot start a new wave while one is active.");
            return 'WAVE_ACTIVE'; // Indicate a wave is already running
        }

        this.currentWaveIndex++;

        if (this.currentWaveIndex >= this.waveConfigs.length) {
            console.log("All waves completed!");
            return 'GAME_WON'; // Signal that all waves are done
        }

        const currentConfig = this.waveConfigs[this.currentWaveIndex];
        this.enemiesToSpawn = JSON.parse(JSON.stringify(currentConfig.enemies)); // Deep copy
        this.spawnTimer = 0; // Start spawning immediately or use config.delay if needed differently
        this.activeWave = true;
        console.log(`Starting Wave ${this.getCurrentWaveNumber()}`);
        return 'WAVE_STARTED';
    }

    update(deltaTime) {
        if (!this.activeWave) {
            return null; // Nothing to do if wave isn't active
        }

        this.spawnTimer -= deltaTime;

        if (this.spawnTimer <= 0 && this.enemiesToSpawn.length > 0) {
            // Find the first enemy type in the list to spawn
            const spawnInfo = this.enemiesToSpawn[0];
            const enemyTypeConfig = ENEMY_CONFIGS[spawnInfo.type];

            if (!enemyTypeConfig) {
                console.error(`Unknown enemy type: ${spawnInfo.type}`);
                // Remove this invalid type to prevent infinite loop
                this.enemiesToSpawn.shift();
                return null;
            }

            // Create and add the enemy
            const enemy = new Enemy(this.path, this.scene, enemyTypeConfig); // Corrected argument order
            this.enemiesArray.push(enemy); // Add to the main array

            // Decrement count for this type
            spawnInfo.count--;

            // Reset timer for the *next* spawn of this type
            this.spawnTimer = spawnInfo.interval;

            // If count for this type reaches 0, remove it from the list
            if (spawnInfo.count <= 0) {
                this.enemiesToSpawn.shift(); // Remove the completed type
                // If there's another type immediately next, reset timer for that one
                if (this.enemiesToSpawn.length > 0) {
                   this.spawnTimer = this.enemiesToSpawn[0].interval; // Use next interval immediately
                }
            }
        }

        // Check for wave completion
        if (this.enemiesToSpawn.length === 0 && this.enemiesArray.length === 0) {
            console.log(`Wave ${this.getCurrentWaveNumber()} Complete!`);
            this.activeWave = false;
            return 'WAVE_COMPLETE';
        }

        return null; // Wave still ongoing or spawning
    }

    isWaveActive() {
        return this.activeWave;
    }

    getCurrentWaveNumber() {
        // Return 1-based wave number for display
        return this.currentWaveIndex + 1;
    }
}