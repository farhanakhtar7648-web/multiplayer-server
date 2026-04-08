const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 10000 });

wss.on("connection", function connection(ws) {
    console.log("Player connected");

    ws.on("message", function incoming(message) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
});