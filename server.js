const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

let players = {}; // name -> socket

wss.on("connection", (ws) => {

	console.log("Player connected");

	ws.on("message", (msg) => {

		let data;

		try {
			data = JSON.parse(msg);
		} catch (e) {
			return;
		}

		// 👤 SET NAME (MAIN SYSTEM)
		if (data.type === "set_name") {

			let name = data.name;

			// ❌ duplicate name check
			if (players[name]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "This name already exists"
				}));

				return;
			}

			// save player
			ws.name = name;
			ws.id = data.id;

			players[name] = ws;

			console.log("Joined:", name);

			sendPlayers();

			return;
		}

		// 💬 CHAT
		if (data.type === "chat") {

			if (!ws.name) return;

			broadcast({
				type: "chat",
				msg: ws.name + ": " + data.msg
			});
		}

	});

	// ❌ DISCONNECT
	ws.on("close", () => {

		if (ws.name && players[ws.name]) {

			delete players[ws.name];

			sendPlayers();
		}
	});
});


// 📤 PLAYER LIST SEND
function sendPlayers() {

	broadcast({
		type: "players",
		list: Object.keys(players)
	});
}


// 📡 BROADCAST
function broadcast(data) {

	let msg = JSON.stringify(data);

	for (let p in players) {

		if (players[p].readyState === WebSocket.OPEN) {
			players[p].send(msg);
		}
	}
}

console.log("🚀 Server running...");