const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

let players = {};

console.log("🚀 SERVER RUNNING");

wss.on("connection", (ws) => {

	console.log("✅ Player Connected");

	ws.on("message", (msg) => {

		let data;

		try {
			data = JSON.parse(msg);
		} catch (e) {
			return;
		}

		// 👤 SET NAME
		if (data.type === "set_name") {

			let username = data.name;

			if (players[username]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "Username exists"
				}));

				return;
			}

			ws.name = username;

			players[username] = {
				ws: ws,
				x: 0,
				y: 5,
				z: 0,
				rot_y: 0,
				anim: "idle"
			};

			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			sendPlayers();
			sendPositions();
			return;
		}

		// 👥 GET PLAYERS
		if (data.type === "get_players") {
			sendPlayers();
			sendPositions();
			return;
		}

		// 📍 POSITION UPDATE
		if (data.type === "pos") {

			if (!players[ws.name]) return;

			players[ws.name].x = data.x;
			players[ws.name].y = data.y;
			players[ws.name].z = data.z;
			players[ws.name].rot_y = data.rot_y;
			players[ws.name].anim = data.anim;

			sendPositions();
			return;
		}
	});

	ws.on("close", () => {

		console.log("❌ Left:", ws.name);

		delete players[ws.name];

		sendPlayers();
		sendPositions();
	});
});

function sendPlayers() {

	let names = Object.keys(players);

	broadcast({
		type: "players",
		list: names
	});
}

function sendPositions() {

	let list = {};

	for (let p in players) {

		list[p] = {
			x: players[p].x,
			y: players[p].y,
			z: players[p].z,
			rot_y: players[p].rot_y,
			anim: players[p].anim
		};
	}

	broadcast({
		type: "positions",
		list: list
	});
}

function broadcast(data) {

	let msg = JSON.stringify(data);

	for (let p in players) {

		let client = players[p].ws;

		if (client.readyState === WebSocket.OPEN) {
			client.send(msg);
		}
	}
}