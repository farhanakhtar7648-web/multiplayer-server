const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

// 👤 players database
let players = {};

wss.on("connection", (ws) => {

	console.log("✅ Player Connected");

	ws.on("message", (msg) => {

		let data;

		try {

			data = JSON.parse(msg);

		} catch (e) {

			return;
		}

		// 👤 USERNAME SYSTEM
		if (data.type === "set_name") {

			let username = data.name;

			// ❌ duplicate check
			if (players[username]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "This username already exists"
				}));

				return;
			}

			// ✅ save player
			ws.name = username;
			ws.id = data.id;

			players[username] = ws;

			console.log("👤 Saved:", username);

			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			sendPlayerList();

			return;
		}
	});

	// ❌ DISCONNECT
	ws.on("close", () => {

		if (ws.name) {

			delete players[ws.name];

			console.log("❌ Left:", ws.name);

			sendPlayerList();
		}
	});
});


// 📤 SEND PLAYER LIST
function sendPlayerList() {

	let list = Object.keys(players);

	let data = JSON.stringify({
		type: "players",
		list: list
	});

	for (let p in players) {

		if (players[p].readyState === WebSocket.OPEN) {

			players[p].send(data);
		}
	}
}

console.log("🚀 SERVER RUNNING");