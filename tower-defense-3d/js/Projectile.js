import * as THREE from 'three';

export class Projectile {
    constructor(startPosition, targetEnemy, scene, config = {}) {
        const { speed = 20, color = 0x00ff00, size = 0.1, damage = 10 } = config;

        this.targetEnemy = targetEnemy;
        this.scene = scene;
        this.speed = speed;
        this.damage = damage;

        // Use basic material for visibility without lighting
        const geometry = new THREE.SphereGeometry(size, 8, 8); // Simple geometry
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.copy(startPosition);
        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        // Check if target is still valid (exists and not dead)
        if (!this.targetEnemy || this.targetEnemy.isDead()) {
            return 'INVALID_TARGET';
        }

        const targetPosition = this.targetEnemy.mesh.position;
        const direction = new THREE.Vector3().subVectors(targetPosition, this.mesh.position);
        const distance = direction.length();
        const moveDistance = this.speed * deltaTime;

        // Simple distance check for hit detection
        // Using a small threshold like 0.5 or comparing with combined radii
        // Let's use a simple distance threshold for now
        const hitThreshold = (this.targetEnemy.mesh.geometry.parameters.radius || 0.5) + (this.mesh.geometry.parameters.radius || 0.1);
        // Or simpler: const hitThreshold = 0.5;

        if (distance <= moveDistance || distance <= hitThreshold) {
            // Deal damage upon hit
            this.targetEnemy.takeDamage(this.damage);
            return 'HIT_TARGET';
        } else {
            // Move towards target
            direction.normalize();
            this.mesh.position.addScaledVector(direction, moveDistance);
            return 'MOVING';
        }
    }

    dispose() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            // Optional: Dispose geometry and material if needed, though less critical for simple shapes
            // this.mesh.geometry.dispose();
            // this.mesh.material.dispose();
        }
        this.mesh = null;
        this.scene = null;
        this.targetEnemy = null; // Clear reference
    }
}