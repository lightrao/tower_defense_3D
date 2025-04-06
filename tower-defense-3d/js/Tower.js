import * as THREE from 'three';
import { Projectile } from './Projectile.js';

/**
 * Represents a basic tower in the game.
 */
export class Tower {
    /**
     * Creates a new Tower instance.
     * @param {THREE.Vector3} position - The position to place the tower.
     * @param {THREE.Scene} scene - The scene to add the tower mesh to.
     * @param {object} config - Tower configuration.
     * @param {number} [config.cost=50] - The gold cost of the tower.
     * @param {number} [config.color=0x0000ff] - The color of the tower mesh.
     * @param {object} [config.size={ width: 0.8, height: 1.5, depth: 0.8 }] - Dimensions of the tower mesh.
     * @param {number} [config.range=5] - The attack range of the tower.
     * @param {number} [config.damage=10] - The damage per attack.
     * @param {number} [config.fireRate=1] - Attacks per second.
     */
    constructor(position, scene, projectilesArray, config = {}) {
        this.scene = scene; // Store scene reference early
        this.projectilesArray = projectilesArray; // Store reference to the global projectiles array
        const {
            cost = 50,
            color = 0x0000ff,
            size = { width: 0.8, height: 1.5, depth: 0.8 },
            range = 5, // Base range
            damage = 10, // Base damage
            fireRate = 1 // Attacks per second (can also be upgraded later if desired)
        } = config;

        this.cost = cost; // Base cost for building
        this.position = position.clone(); // Store a copy

        // Upgradeable stats
        this.level = 1;
        this.baseDamage = damage;
        this.baseRange = range;
        this.fireRate = fireRate; // Keep fireRate simple for now

        // Calculate current stats based on level
        this.damage = this.baseDamage;
        this.range = this.baseRange;

        this.currentTarget = null; // The enemy the tower is currently targeting
        this.fireCooldown = 0; // Time remaining until the next shot

        // Create the visual representation (mesh)
        const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
        const material = new THREE.MeshStandardMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);

        // Position the mesh correctly on the ground plane (Y=0)
        this.mesh.position.copy(this.position);
        this.mesh.position.y += size.height / 2; // Adjust Y so the base is at position.y

        // Add the mesh to the scene
        this.mesh.userData.towerInstance = this; // Link mesh back to this object for clicks
        this.scene.add(this.mesh);

        console.log(`Tower created at (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}) - Lvl: ${this.level}, Cost: ${this.cost}, Range: ${this.range.toFixed(1)}, Dmg: ${this.damage.toFixed(1)}, Rate: ${this.fireRate}`);
    }

    /**
     * Removes the tower's mesh from the scene.
     */
    dispose() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            // Optional: Dispose geometry and material if no longer needed by other towers
            // this.mesh.geometry.dispose();
            // this.mesh.material.dispose();
            console.log(`Tower removed from (${this.position.x}, ${this.position.y}, ${this.position.z}).`);
        }
        this.mesh = null;
        this.scene = null; // Release reference
    }

    /**
     * Calculates the cost to upgrade the tower to the next level.
     * @returns {number} The gold cost for the next upgrade.
     */
    getUpgradeCost() {
        // Example cost scaling: doubles each level (adjust formula as needed)
        // Base cost (this.cost) is the build cost, maybe upgrade cost starts lower?
        // Let's base it on build cost * 2^(level)
        return Math.floor(this.cost * Math.pow(1.8, this.level)); // Slightly less than doubling
    }

    /**
     * Upgrades the tower to the next level, increasing its stats.
     * @returns {boolean} True if the upgrade was successful, false otherwise (e.g., max level).
     */
    upgrade() {
        // Optional: Add a max level check
        // const MAX_LEVEL = 5;
        // if (this.level >= MAX_LEVEL) {
        //     console.log("Tower is already at max level.");
        //     return false;
        // }

        this.level++;

        // Increase stats based on level (example: 20% damage, 10% range per level)
        this.damage = this.baseDamage * Math.pow(1.2, this.level - 1);
        this.range = this.baseRange * Math.pow(1.1, this.level - 1);

        // Optional: Slightly change appearance (e.g., color tint, scale)
        // Example: Make it slightly taller or change color tint
        // this.mesh.scale.y = 1 + (this.level - 1) * 0.1;
        // this.mesh.position.y = (this.mesh.geometry.parameters.height * this.mesh.scale.y) / 2;
        // this.mesh.material.color.lerp(new THREE.Color(0xffffff), 0.1); // Tint towards white

        console.log(`Tower upgraded to Level ${this.level}. Dmg: ${this.damage.toFixed(1)}, Range: ${this.range.toFixed(1)}`);
        return true;
    }


    /**
     * Finds the first valid enemy within range.
     * @param {Enemy[]} enemies - An array of active enemies.
     */
    findTarget(enemies) {
        this.currentTarget = null; // Reset target each time
        let closestDistanceSq = this.range * this.range; // Use squared distance for efficiency

        for (const enemy of enemies) {
            if (enemy.isDead()) continue; // Skip dead enemies

            const distanceSq = this.mesh.position.distanceToSquared(enemy.mesh.position);

            if (distanceSq <= closestDistanceSq) {
                // Found a potential target within range
                // For simplicity, target the first one found. Could be improved later (e.g., closest).
                this.currentTarget = enemy;
                console.log(`Tower at (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}) found target enemy.`); // ADDED LOG
                // closestDistanceSq = distanceSq; // Uncomment to target the *closest* enemy instead of the first
                break; // Target the first enemy found in range
            }
        }

        // Re-validate target: Check if it's still alive and in range after the loop (or if it was initially null)
        if (this.currentTarget) {
            if (this.currentTarget.isDead() || this.mesh.position.distanceToSquared(this.currentTarget.mesh.position) > this.range * this.range) {
                this.currentTarget = null; // Target became invalid
            }
        }
    }

    /**
     * Attacks the given target enemy.
     * @param {Enemy} target - The enemy to attack.
     */
    attack(target) {
        if (!target || target.isDead()) {
            this.currentTarget = null; // Ensure target is valid before attacking
            return;
        }

        console.log(`Tower at (${this.position.x.toFixed(1)}, ${this.position.z.toFixed(1)}) firing at enemy.`);

        // Create projectile instead of dealing direct damage
        const projectileConfig = {
            speed: 20, // Adjust speed as needed
            color: 0x00ff00, // Green projectiles
            size: 0.1,
            damage: this.damage
        };

        // Calculate start position (e.g., top of the tower)
        const towerHeight = this.mesh.geometry.parameters.height;
        const startPos = this.mesh.position.clone().add(new THREE.Vector3(0, towerHeight / 2 + 0.1, 0)); // Slightly above the mesh center

        // Instantiate the projectile
        const projectile = new Projectile(startPos, target, this.scene, projectileConfig);

        // Add the projectile to the main list for updates
        if (this.projectilesArray) {
             this.projectilesArray.push(projectile);
        } else {
            console.error("Projectiles array not provided to Tower!");
        }


        this.fireCooldown = 1 / this.fireRate; // Reset cooldown after firing
    }

    /**
     * Updates the tower's state, including targeting and attacking.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {Enemy[]} enemies - An array of active enemies.
     */
    update(deltaTime, enemies) {
        // Decrement cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }

        // Find a target if we don't have one or the current one is invalid
        if (!this.currentTarget || this.currentTarget.isDead() || this.mesh.position.distanceToSquared(this.currentTarget.mesh.position) > this.range * this.range) {
            this.findTarget(enemies);
        }

        // If we have a valid target and cooldown is ready, attack
        if (this.currentTarget && this.fireCooldown <= 0) {
            this.attack(this.currentTarget);
        }
    }
}