const path = require("node:path");
const fs = require("node:fs/promises");
const env = require("dotenv").config({ path: ".env" }).parsed;

const dir = path.join(__dirname, "build");
fs.mkdir(dir, { recursive: true });

async function buildHtml() {
    const source = path.join(__dirname, "src/pages/overlay.hbs");
    const dest = path.join(dir, "overlay.html");
    const input = await fs.readFile(source, { encoding: "utf-8" });
    const output = input.split(/<body.*>/).pop().split(/<\/body>/).shift();
    await fs.writeFile(dest, output);
    console.log("Build HTML:", dest);
}

async function buildJs() {
    const source = path.join(__dirname, "public/overlay.js");
    const dest = path.join(dir, "overlay.js");
    const input = await fs.readFile(source, { encoding: "utf-8" });
    const output = input.replace(/window\.SOCKET/g, `"${env.SOCKET}"`);
    await fs.writeFile(dest, output);
    console.log("Build JS:", dest);
}

async function buildCss() {
    const source = path.join(__dirname, "public/overlay.css");
    const dest = path.join(dir, "overlay.css");
    const input = await fs.readFile(source, { encoding: "utf-8" });
    const output = input;
    await fs.writeFile(dest, output);
    console.log("Build CSS:", dest);
}


async function run() {
    console.log("Building Overlay...");
    await buildHtml();
    await buildJs();
    await buildCss();
    console.log("Build complete!");
}
run();
