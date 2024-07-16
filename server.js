const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
    // set this to true for detailed logging:
    logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public"),
    prefix: "/", // optional: default '/'
});

// point-of-view is a templating manager for fastify
fastify.register(require("@fastify/view"), {
    engine: {
        handlebars: require("handlebars"),
    },
});

fastify.get("/", function (request, reply) {
    return reply.view("/src/pages/index.hbs");
});

let speed = 0;
fastify.post("/", function (request, reply) {
    // Time, latitude and longitude from device
    const { time, latitude, longitude } = JSON.parse(request.body);

    // Compute distance and time
    const distance = haversine(latitude, longitude);
    const delta = deltaTime(time);

    // If time delta is less than 10 ms, ignore this update
    if (delta < toHours(10)) return { speed };

    // Reply with speed as JSON
    speed = distance / delta;
    console.log(JSON.stringify({
        time: new Date(time).toLocaleTimeString(),
        latitude,
        longitude,
        distance: `${distance.toFixed(4)}km`,
        delta: `${(delta * 3600).toFixed(2)}s`,
        speed: `${speed.toFixed(2)}km/h`
    }, undefined, 4));
    return { speed };
});

fastify.get("/speed", function (request, reply) {
    // Reply with speed as number
    return speed;
});

fastify.get("/overlay", function (request, reply) {
    return reply.view("/src/pages/overlay.html");
});

// Run the server and report out to the logs
fastify.listen(
    { port: process.env.PORT, host: "0.0.0.0" },
    function (err, address) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Your app is listening on ${address}`);
    }
);

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