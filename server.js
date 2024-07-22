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

// Speed
let speed = 0;

// WebSocket
const WebSocket = require("ws").WebSocketServer;
const wss = new WebSocket(fastify);
const decoder = new TextDecoder();
wss.on("connection", function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", function message(rawData) {
        const data = JSON.parse(decoder.decode(rawData));
        speed = data.speed;
        console.log(`${new Date().toLocaleTimeString()} ${speed.toFixed(2)}km/h`);

        wss.clients.forEach(client => {
            if (client === ws) return;
            client.send(JSON.stringify({ speed }));
        })
    });
});

// StreamElements Overlay (test)
fastify.get("/overlay", function (request, reply) {
    return reply.view("/src/pages/overlay.html");
});

// Lifeline
fastify.get("/ping", function (request, reply) {
    console.log("I'm alive");
    return reply.code(200).send("pong");
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
