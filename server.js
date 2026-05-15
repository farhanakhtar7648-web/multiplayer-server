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


		// 👤 SET NAME
		if (data.type === "set_name") {

			let username = data.name;

			// ❌ DUPLICATE NAME
			if (players[username]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "This username already exists"
				}));

				return;
			}

			// ✅ SAVE PLAYER
			ws.name = username;
			ws.id = data.id;

			players[username] = ws;

			console.log("👤 Joined:", username);

			// ✅ SUCCESS
			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			// 👥 UPDATE PLAYERS
			sendPlayers();

			return;
		}


		// 🎮 JOIN MATCH
		if (data.type === "join_match") {

			console.log("🎮 Matchmaking:", ws.name);

			// 👥 SEND PLAYERS AGAIN
			sendPlayers();

			// 🚀 OPEN LOBBY
			ws.send(JSON.stringify({
				type: "go_lobby"
			}));

			return;
		}


		// ▶ START GAME
		if (data.type === "start_game") {

			console.log("🚀 Starting Game");

			broadcast({
				type: "start_game"
			});

			return;
		}
	});


	// ❌ DISCONNECT
	ws.on("close", () => {

		console.log("❌ Player Left");

		// REMOVE PLAYER
		if (ws.name && players[ws.name]) {

			delete players[ws.name];

			console.log("Removed:", ws.name);

			sendPlayers();
		}
	});
});


// 👥 SEND PLAYER LIST
function sendPlayers() {

	let list = Object.keys(players);

	broadcast({
		type: "players",
		list: list
	});
}


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