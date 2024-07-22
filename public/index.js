// @TODO Change the URL below to match your Glitch URL
const url = "ws://localhost:3000";//"wss://krisskong-speedometer.glitch.me";

let websocket = null;
function connect() {
    websocket = new WebSocket(url);
}

// Focus
document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") start();
    else stop();
});

// UI
const button = document.querySelector("#start");
button.addEventListener("click", start);
const running = document.querySelector("#running");
running.style.display = "none";
const info = document.querySelector("#data");

// Hooks
let watch = null;
let lifeline = null;
let wake = null;
let fakeWatch = null;

// Debug
const params = new URLSearchParams(window.location.search);
const debug = params.has("debug");
if (debug) {
    watch = setInterval(fakePosition, 2000);
}

// Geolocation logic
const data = { latitude: 0, longitude: 0, time: -1, speed: 0 };
start();
function start() {
    // Stop watching Geolocation if it is already running
    if (watch !== null) stop();
    // Start watching Geolocation
    if (!debug) {
        watch = navigator.geolocation.watchPosition(onPosition, onError, {
            enableHighAccuracy: true,
            timeout: 10000
        });
    } else {
        watch = setInterval(fakePosition, 500);
    }

    // Reconnect socket
    if (!websocket || 
        websocket.readyState !== WebSocket.CONNECTING ||
        websocket.readyState !== websocket.OPEN) {
        connect();
    }

    // Prevent server from sleeping by pinging it every 5 minutes
    lifeline = setInterval(keepAlive, 5 * 60_000);

    // Prevent device sleep
    navigator.wakeLock.request("screen").then(function (lock) { wake = lock; });

    // Show the info
    button.style.display = "none";
    running.style.display = "";
}

function stop() {
    // Stop watching Geolocation
    if (!debug) {
        navigator.geolocation.clearWatch(watch);
    } else {
        clearInterval(watch);
    }
    watch = null;

    // Let server sleep
    clearInterval(lifeline);
    lifeline = null;

    // Release wake lock
    if (wake) wake.release();

    // Show button
    button.style.display = "";
    running.style.display = "none";
}

function keepAlive() {
    fetch("/ping");
}

function updateInfo() {
    info.innerHTML =
        `Latitude: ${data.latitude.toFixed(8)}<br/>` +
        `Longitude: ${data.longitude.toFixed(8)}<br/>` +
        `Last updated: ${new Date(data.time).toLocaleTimeString()}<br/>` +
        `Speed: ${data.speed.toFixed(2)} km/h`;
}

async function updatePosition() {
    // Send speed to server websocket
    if (websocket.readyState !== WebSocket.OPEN) return;
    websocket.send(JSON.stringify({ speed: data.speed }));
}

function onPosition(pos) {
    // Get position from Geolocation
    const { latitude, longitude } = pos.coords;
    const time = Date.now();
    data.latitude = latitude;
    data.longitude = longitude;
    data.time = time;
    const distance = haversine(latitude, longitude);
    const delta = deltaTime(time);
    if (delta > toHours(10)) {
        data.speed = distance / delta;
    }
    updatePosition();
    updateInfo();
}

function onError(e) {
    // Handle errors
    console.error(e);
    running.innerHTML = `Something went wrong! Refresh and try again.<br/>Error code: ${e.code}`;
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

const last = {
    valid: false,
    latitude: 0,
    longitude: 0,
    time: -1
};

function toRadians(degrees) {
    return degrees / 180 * Math.PI;
}

function toHours(milliseconds) {
    return milliseconds / 3600000;
}

/**
 * Haversine Distance Formula between last and current position
 * @param {number} latitude Latitude in degrees
 * @param {number} longitude Longitude in degrees
 * @returns Haversine distance in kilometers
 */
function haversine(latitude, longitude) {
    let distance = 0;
    if (last.valid) {
        const R = 6371;
        const lat1 = toRadians(last.latitude);
        const lat2 = toRadians(latitude);
        const lon1 = toRadians(last.longitude);
        const lon2 = toRadians(longitude);
        const sdLat = Math.sin((lat2 - lat1) / 2);
        const sdLon = Math.sin((lon2 - lon1) / 2);
        const cLat1 = Math.cos(lat1);
        const cLat2 = Math.cos(lat2);
        const a = sdLat * sdLat + cLat1 * cLat2 * sdLon * sdLon;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
    }

    last.latitude = latitude;
    last.longitude = longitude;
    last.valid = true;

    return distance;
}

/**
 * Time between last and current update
 * @param {number} time Current time
 * @returns Delta Time in hours
 */
function deltaTime(time) {
    let delta = 0;
    if (time > 0) {
        delta = toHours(time - last.time);
    }

    last.time = time;

    return delta;
}