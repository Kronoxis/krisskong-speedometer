let websocket = null;
function connect() {
    websocket = new WebSocket(window.SOCKET);
}
connect();

class Speedometer {
    constructor() {
        this.element = document.querySelector("#speedometer");
        this.display = this.element.querySelector("#display");
        this.needle = this.element.querySelector("#needle");
        this._speed = 0;
        this._target = 0;
        this._update = this.update.bind(this);
        this._time = -1;

        this.update();
    }

    get speed() { return this._speed; }
    set speed(speed) { this._target = speed; }

    update(time) {
        if (this._time > 0) {
            const deltaTime = (time - this._time) * 0.001;
            const t = Math.min(deltaTime, Math.max(deltaTime, 0.001), 0.2);
            this._speed = this._speed * (1 - t) + this._target * t;
            this.display.innerHTML = `${this._speed.toFixed(0)}`;
            this.needle.style.rotate = `${this._speed - 170}deg`;
        }
        this._time = time;
        requestAnimationFrame(this._update);
    }
}

const speedometer = new Speedometer();

websocket.onmessage = function (event) {
    const { data } = event;
    const { speed } = JSON.parse(data);
    speedometer.speed = Math.min(speed, Math.max(speed, 0), 260);
}