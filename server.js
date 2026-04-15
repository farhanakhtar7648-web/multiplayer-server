const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 10000 });

let players = [];

wss.on("connection", (ws) => {
    console.log("Player connected");

    ws.on("message", (message) => {
        let data;

        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            return;
        }

        // 👉 PLAYER JOIN
        if (data.type === "join") {
            ws.name = data.name;

            // duplicate avoid
            if (!players.includes(ws.name)) {
                players.push(ws.name);
            }

            console.log("Joined:", ws.name);

            broadcast({
                type: "players",
                list: players
            });
        }

        // 👉 CHAT
        if (data.type === "chat") {
            broadcast({
                type: "chat",
                msg: data.name + ": " + data.msg
            });
        }

        // 🚗 START GAME
        if (data.type === "start") {
            console.log("Game Starting...");

            let cars = ["Car1", "Car2"];

            // shuffle cars
            let shuffled = cars.sort(() => 0.5 - Math.random());

            let assigned = [];

            players.forEach((p, i) => {
                assigned.push({
                    name: p,
                    car: shuffled[i % shuffled.length]
                });
            });

            broadcast({
                type: "start",
                players: assigned
            });
        }
    });

    ws.on("close", () => {
        console.log("Player disconnected:", ws.name);

        players = players.filter(p => p !== ws.name);

        broadcast({
            type: "players",
            list: players
        });
    });
});

function broadcast(data) {
    const msg = JSON.stringify(data);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

console.log("🚀 Server running...");