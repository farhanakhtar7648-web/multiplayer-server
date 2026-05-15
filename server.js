const WebSocket = require("ws");

// 🌐 SERVER
const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

// 👥 PLAYERS
let players = {};

console.log("🚀 SERVER RUNNING");


// 🌐 NEW CONNECTION
wss.on("connection", (ws) => {

	console.log("✅ Player Connected");

	// 📩 MESSAGE
	ws.on("message", (msg) => {

		let data;

		try {

			data = JSON.parse(msg);

		} catch (e) {

			console.log("❌ Invalid JSON");

			return;
		}


		// 👤 SAVE PLAYER NAME
		if (data.type === "set_name") {

			let username = data.name;

			// ❌ duplicate username
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

			// ✅ success
			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			return;
		}


		// 🎮 MATCHMAKING
		if (data.type === "join_match") {

			console.log("🎮 Matchmaking:", ws.name);

			// 🚀 OPEN LOBBY
			ws.send(JSON.stringify({
				type: "go_lobby"
			}));

			return;
		}


		// 💬 CHAT SYSTEM
		if (data.type === "chat") {

			if (!ws.name) return;

			broadcast({
				type: "chat",
				msg: ws.name + ": " + data.msg
			});

			return;
		}
	});


	// ❌ DISCONNECT
	ws.on("close", () => {

		console.log("❌ Player Left");

		// remove player
		if (ws.name && players[ws.name]) {

			delete players[ws.name];

			console.log("Removed:", ws.name);
		}
	});
});


// 📡 BROADCAST
function broadcast(data) {

	let msg = JSON.stringify(data);

	for (let p in players) {

		let client = players[p];

		if (client.readyState === WebSocket.OPEN) {

			client.send(msg);
		}
	}
}