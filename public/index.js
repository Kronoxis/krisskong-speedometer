document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") start();
    else stop();
});

const button = document.querySelector("#start");
button.addEventListener("click", start);
const running = document.querySelector("#running");
running.style.display = "none";
const info = document.querySelector("#data");

let isFake = false;
let watch = null;
let poller = null;
let wake = null;
let fakeWatch = null;
const data = { latitude: 0, longitude: 0, time: -1, speed: 0, delivered: true, immediate: false };
start();
function start() {
    // Stop watching Geolocation if it is already running
    if (watch !== null) stop();
    // Start watching Geolocation
    watch = navigator.geolocation.watchPosition(onPosition, onError, {
        enableHighAccuracy: true,
        timeout: 10000
    });
    // Poll the position from the server repeatedly
    poller = setInterval(updatePosition, 2000);

    // Prevent device sleep
    navigator.wakeLock.request("screen").then(function (lock) { wake = lock; });

    // Show the info
    button.style.display = "none";
    running.style.display = "";
}

function stop() {
    // Stop watching Geolocation
    navigator.geolocation.clearWatch(watch);
    watch = null;

    // Stop fake Geolocation data
    clearInterval(fakeWatch);
    fakeWatch = null;

    // Stop polling position from server
    clearInterval(poller);
    poller = null;

    // Release wake lock
    if (wake) wake.release();

    // Show button
    button.style.display = "";
    running.style.display = "none";
}

function updateInfo() {
    info.innerHTML =
        `Latitude: ${data.latitude.toFixed(8)}<br/>` +
        `Longitude: ${data.longitude.toFixed(8)}<br/>` +
        `Last updated: ${new Date(data.time).toLocaleTimeString()}<br/>` +
        `Speed: ${data.speed.toFixed(2)} km/h`;
}

async function updatePosition() {
    // Don't send duplicate packets
    if (data.delivered) {
        // Next packet should send immediately
        data.immediate = true;
        return;
    }

    // Prevent packet spam in case fetch fails
    data.immediate = false;

    // Get speed from server
    const response = await fetch("/", {
        method: "POST",
        body: JSON.stringify(data)
    });
    const { speed } = await response.json();
    data.speed = speed;
    data.delivered = true;
    updateInfo();
}

function onPosition(pos) {
    // Get position from Geolocation
    const { latitude, longitude } = pos.coords;
    const time = Date.now();
    data.latitude = latitude;
    data.longitude = longitude;
    data.time = time;
    data.delivered = false;
    if (data.immediate) updatePosition();
    else updateInfo();
}

function onError(e) {
    if (e.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
        // Use fake data if Geolocation is unavailable (for debugging)
        isFake = true;
        fakeWatch = setInterval(fakePosition, 2000);
    } else if (!isFake) {
        // Handle errors but ignore timeout when using fake data
        console.error(e);
        running.innerHTML = `Something went wrong! Refresh and try again.<br/>Error code: ${e.code}`;
    }
}

function fakePosition() {
    // Send random position
    onPosition({
        coords: {
            latitude: 52 + Math.random() * 0.0002,
            longitude: 4 + Math.random() * 0.0002
        }
    });
}