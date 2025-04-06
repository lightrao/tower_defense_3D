# Tower Defense 3D

## Description

A web-based 3D Tower Defense game built using standard web technologies. Players place towers to defend against waves of enemies moving along a predefined path.

## File Structure

*   `index.html`: The main HTML file that sets up the game canvas and structure.
*   `style.css`: Contains all the CSS rules for styling the game's visual elements.
*   `js/main.js`: The entry point for the JavaScript code. It orchestrates the game logic and initializes game components.
*   `js/Enemy.js`: Defines the `Enemy` class, including its properties (like health, speed) and behavior (movement along the path).
*   `js/Path.js`: Defines the `Path` class, which represents the route enemies follow.
*   `js/Projectile.js`: Defines the `Projectile` class, handling the characteristics (damage, speed) and behavior of projectiles fired by towers.
*   `js/Tower.js`: Defines the `Tower` class, including its properties (range, fire rate, cost) and behavior (targeting enemies, firing projectiles).
*   `js/WaveManager.js`: Manages the spawning of enemy waves, controlling the timing, type, and number of enemies per wave.

## Technologies Used

*   HTML
*   CSS
*   JavaScript (Organized into modules/classes for game entities)