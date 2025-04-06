import * as THREE from 'three';

/**
 * Represents an enemy unit in the game.
 */
export class Enemy {
    /**
     * Creates an enemy instance.
     * @param {Path} path - The path the enemy follows.
     * @param {THREE.Scene} scene - The scene to add the enemy mesh to.
     * @param {object} config - Configuration for the enemy's stats.
     * @param {number} [config.health=100] - Enemy health.
     * @param {number} [config.speed=2] - Enemy movement speed (units per second).
     * @param {number} [config.value=10] - Value awarded for defeating the enemy.
     * @param {number} [config.color=0xff0000] - Color of the enemy mesh.
     * @param {number} [config.size=0.5] - Size (radius) of the enemy mesh.
     */
    constructor(path, scene, config = {}) {
        this.path = path;
        this.scene = scene;

        // Default configuration
        const defaults = {
            health: 100,
            speed: 2,
            value: 10,
            color: 0xff0000,
            size: 0.5
        };
        // Merge provided config with defaults
        const finalConfig = { ...defaults, ...config };

        this.health = finalConfig.health;
        this.speed = finalConfig.speed;
        this.value = finalConfig.value;

        this.currentWaypointIndex = 0;
        this.waypoints = this.path.getWaypoints();

        if (!this.waypoints || this.waypoints.length === 0) {
            console.error("Enemy created with an invalid or empty path.");
            return; // Prevent further initialization if path is bad
        }

        // Create the visual representation (mesh)
        const geometry = new THREE.SphereGeometry(finalConfig.size, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: finalConfig.color });
        this.mesh = new THREE.Mesh(geometry, material);

        // Set initial position to the first waypoint
        this.mesh.position.copy(this.waypoints[0]);

        // Add mesh to the scene
        if (this.scene) {
            this.scene.add(this.mesh);
        } else {
            console.error("Enemy created without a valid scene.");
        }
    }

    /**
     * Updates the enemy's position along the path.
     * @param {number} deltaTime - Time elapsed since the last frame in seconds.
     */
    update(deltaTime) {
        if (!this.mesh || this.hasReachedEnd()) {
            return; // Nothing to update if mesh doesn't exist or enemy finished
        }

        const targetWaypoint = this.waypoints[this.currentWaypointIndex];
        if (!targetWaypoint) {
             // Should not happen if hasReachedEnd is checked, but good safety net
            console.warn("Target waypoint not found for enemy.");
            return;
        }

        const direction = new THREE.Vector3().subVectors(targetWaypoint, this.mesh.position);
        const distance = direction.length();
        const moveDistance = this.speed * deltaTime;

        if (moveDistance >= distance) {
            // Reached or passed the waypoint
            this.mesh.position.copy(targetWaypoint);
            this.currentWaypointIndex++;
        } else {
            // Move towards the waypoint
            direction.normalize();
            this.mesh.position.addScaledVector(direction, moveDistance);
        }
    }

    /**
     * Reduces the enemy's health.
     * @param {number} amount - The amount of damage to inflict.
     */
    takeDamage(amount) {
        this.health -= amount;
        // Optional: Add visual feedback for damage here
    }

    /**
     * Checks if the enemy's health is depleted.
     * @returns {boolean} True if health is 0 or less, false otherwise.
     */
    isDead() {
        return this.health <= 0;
    }

    /**
     * Checks if the enemy has reached the end of the path.
     * @returns {boolean} True if the enemy has passed the last waypoint, false otherwise.
     */
    hasReachedEnd() {
        return this.currentWaypointIndex >= this.waypoints.length;
    }

    /**
     * Removes the enemy's mesh from the scene and cleans up resources.
     */
    dispose() {
        if (this.scene && this.mesh) {
            this.scene.remove(this.mesh);
        }
        // Optional: Dispose geometry and material if they are unique to this enemy
        // if (this.mesh) {
        //     if (this.mesh.geometry) this.mesh.geometry.dispose();
        //     if (this.mesh.material) this.mesh.material.dispose();
        // }
        this.mesh = null; // Help garbage collection
        this.scene = null;
        this.path = null;
    }
}