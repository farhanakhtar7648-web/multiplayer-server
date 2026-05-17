const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

let players = {};

console.log("🚀 SERVER RUNNING");


// 🌐 CONNECTION
wss.on("connection", (ws) => {

	console.log("✅ Player Connected");


	// 📩 MESSAGE
	ws.on("message", (msg) => {

		let data;

		try {

			data = JSON.parse(msg);

		} catch (e) {

			return;
		}


		// 👤 PLAYER NAME
		if (data.type === "set_name") {

			let username = data.name;

			// ❌ duplicate
			if (players[username]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "This username already exists"
				}));

				return;
			}

			ws.name = username;

			players[username] = {
				ws: ws,
				x: 0,
				y: 0,
				z: 0
			};

			console.log("👤 Joined:", username);

			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			sendPlayers();

			return;
		}


		// 🎮 JOIN MATCH
		if (data.type === "join_match") {

			ws.send(JSON.stringify({
				type: "go_lobby"
			}));

			setTimeout(() => {

				sendPlayers();

			}, 500);

			return;
		}


		// 👥 GET PLAYERS
		if (data.type === "get_players") {

			sendPlayers();

			return;
		}


		// ▶ START GAME
		if (data.type === "start_game") {

			broadcast({
				type: "start_game"
			});

			return;
		}


		// 📍 POSITION UPDATE
		if (data.type === "pos") {

			if (!players[ws.name]) return;

			players[ws.name].x = data.x;
			players[ws.name].y = data.y;
			players[ws.name].z = data.z;

			sendPositions();

			return;
		}
	});


	// ❌ DISCONNECT
	ws.on("close", () => {

		console.log("❌ Left:", ws.name);

		delete players[ws.name];

		sendPlayers();
	});
});


// 👥 SEND PLAYERS
function sendPlayers() {

	let names = Object.keys(players);

	broadcast({
		type: "players",
		list: names
	});
}


// 📍 SEND POSITIONS
function sendPositions() {

	let list = {};

	for (let p in players) {

		list[p] = {
			x: players[p].x,
			y: players[p].y,
			z: players[p].z
		};
	}

	broadcast({
		type: "positions",
		list: list
	});
}


// 📡 BROADCAST
function broadcast(data) {

	let msg = JSON.stringify(data);

	for (let p in players) {

		let client = players[p].ws;

		if (client.readyState === WebSocket.OPEN) {

			client.send(msg);
		}
	}
}