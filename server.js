const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 10000 });

let players = [];

wss.on("connection", (ws) => {
    console.log("Player connected");

    ws.on("message", (message) => {
        let data = JSON.parse(message);

        // 👉 PLAYER JOIN
        if (data.type === "join") {
            ws.name = data.name;
            players.push(ws.name);

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
    });

    ws.on("close", () => {
        players = players.filter(p => p !== ws.name);

        broadcast({
            type: "players",
            list: players
        });

        console.log("Player disconnected");
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

console.log("Server running...");