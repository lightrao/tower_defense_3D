import * as THREE from 'three';

class Path {
    constructor() {
        // Define the waypoints for the enemy path
        // Y-coordinate is slightly above the ground (0.0) to ensure visibility
        this.waypoints = [
            new THREE.Vector3(-15, 0.1, 0),   // Start point
            new THREE.Vector3(0, 0.1, 0),     // Turn point 1
            new THREE.Vector3(0, 0.1, 15),    // Turn point 2
            new THREE.Vector3(15, 0.1, 15)    // End point
        ];
    }

    /**
     * Returns the array of waypoints.
     * @returns {THREE.Vector3[]} The array of waypoints.
     */
    getWaypoints() {
        return this.waypoints;
    }

    /**
     * Creates a visual representation of the path using THREE.Line.
     * @returns {THREE.Line} The line object representing the path.
     */
    createPathVisual() {
        const points = this.getWaypoints();
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 }); // Yellow color
        const line = new THREE.Line(geometry, material);
        return line;
    }
}

export { Path };