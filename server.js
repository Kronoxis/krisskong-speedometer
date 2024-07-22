const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
    // set this to true for detailed logging:
    logger: false,
});

// Add CORS
fastify.register(require("@fastify/cors"), {
    origin: "*"
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
    speed = JSON.parse(request.body).speed;
    console.log(`${speed.toFixed(2)}km/h`);
    return reply.code(200).send(speed);
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