# Speedometer

## Configuration (glitch.com)
1. Configure `SOCKET` in .env
2. Open terminal
3. Enter the following command
```sh
npm run build && refresh
```
4. Copy `build/overlay.html` into StreamElements Custom Element HTML
5. Copy `build/overlay.css` into StreamElements Custom Element CSS
6. Copy `build/overlay.js` into StreamElements Custom Element JS

## Usage
Open the glitch.me website. 
It should automatically start showing your realtime location data and speed.

⚠ Keep the website open.
Location data will stop updating if the device sleeps or the tab becomes inactive.

## Troubleshooting
If the overlay is stuck on `N/A`, refresh the overlay to restart the connection.