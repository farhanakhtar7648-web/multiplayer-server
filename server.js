const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

const ROOM_NAME = "AFA LEGENDS";
const MAX_PLAYERS = 10;

let players = {};
let startVotes = new Set();
let banned = {};

wss.on("connection", (ws) => {

	console.log("Player connected");

	ws.on("message", (message) => {

		let data;

		try {
			data = JSON.parse(message);
		} catch (e) {
			return;
		}

		// 👤 REGISTER NAME
		if (data.type === "set_name") {

			if (isNameTaken(data.name)) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "This name already exists"
				}));

				return;
			}

			if (banned[data.name]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "You are banned for 5 minutes"
				}));

				return;
			}

			if (Object.keys(players).length >= MAX_PLAYERS) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "Room full, please wait second round"
				}));

				return;
			}

			ws.name = data.name;
			ws.room = ROOM_NAME;

			players[data.name] = ws;

			sendPlayers();

			console.log("Joined:", data.name);

			return;
		}

		// 💬 CHAT
		if (data.type === "chat") {

			if (!ws.name) return;

			let color = "white";

			if (data.msg.toLowerCase() === "start") {

				startVotes.add(ws.name);
				color = "yellow";

				checkStart();
			}

			if (data.msg.startsWith("ban/")) {

				let target = data.msg.split("/")[1];

				if (players[target]) {

					banned[target] = true;

					setTimeout(() => {
						delete banned[target];
					}, 5 * 60 * 1000);

					players[target].close();
					delete players[target];
				}

				sendPlayers();
				return;
			}

			broadcast({
				type: "chat",
				msg: ws.name + ": " + data.msg,
				color: color
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

// 🧠 START CHECK
function checkStart() {

	if (startVotes.size >= Object.keys(players).length && Object.keys(players).length > 0) {

		broadcast({
			type: "start_countdown"
		});

		setTimeout(() => {

			broadcast({
				type: "game_start"
			});

			startVotes.clear();

		}, 3000);
	}
}

// 📤 PLAYER LIST
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

		if (players[p].readyState === WebSocket.OPEN) {
			players[p].send(msg);
		}
	}
}

// 🔍 NAME CHECK
function isNameTaken(name) {
	return players[name] !== undefined;
}

console.log("🚀 Server running AFA LEGENDS...");