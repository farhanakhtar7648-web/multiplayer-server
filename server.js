const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 10000 });

let rooms = {};

wss.on("connection", (ws) => {
    console.log("Player connected");

    ws.on("message", (message) => {
        let data;

        // 🛡 SAFE PARSE
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        // 👉 JOIN ROOM
        if (data.type === "join") {
            ws.name = data.name;
            ws.room = data.room;

            if (!rooms[ws.room]) {
                rooms[ws.room] = [];
            }

            // ❌ duplicate avoid
            if (!rooms[ws.room].includes(ws)) {
                rooms[ws.room].push(ws);
            }

            sendPlayers(ws.room);
        }

        // 👉 CHAT
        if (data.type === "chat") {
            broadcast(ws.room, {
                type: "chat",
                msg: data.name + ": " + data.msg
            });
        }

        // 👉 START
        if (data.type === "start") {
            let players = rooms[ws.room].map(p => p.name);

            broadcast(ws.room, {
                type: "start",
                players: players
            });
        }
    });

    // ❌ DISCONNECT
    ws.on("close", () => {
        if (ws.room && rooms[ws.room]) {
            rooms[ws.room] = rooms[ws.room].filter(p => p !== ws);

            // 🧹 empty room delete
            if (rooms[ws.room].length === 0) {
                delete rooms[ws.room];
            } else {
                sendPlayers(ws.room);
            }
        }

        console.log("Player disconnected");
    });
});

// 📤 SEND PLAYERS
function sendPlayers(room) {
    let list = rooms[room].map(p => p.name);

    broadcast(room, {
        type: "players",
        list: list
    });
}

// 📡 BROADCAST
function broadcast(room, data) {
    if (!rooms[room]) return;

    let msg = JSON.stringify(data);

    rooms[room].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

console.log("🚀 Server running...");