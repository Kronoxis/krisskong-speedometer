# Speedometer

## Configuration
1. Configure Socket in .env
2. Copy src/pages/overlay.hbs into StreamElements Custom Element HTML
    - Replace `{{ SOCKET }}` at the bottom with the Socket url from .env
3. Copy public/overlay.js into StreamElements Custom Element JS
4. Copy public/overlay.css into StreamElements Custom Element CSS

## Usage
- Open the glitch.me website. 
It should automatically start showing your realtime location data and speed.
- Keep the website open.
Location data will stop updating if the device sleeps or the tab becomes inactive.