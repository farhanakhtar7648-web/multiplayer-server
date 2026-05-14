const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

let rooms = {};

wss.on("connection", (ws) => {

	console.log("Player connected");

	ws.on("message", (message) => {

		let data;

		try {
			data = JSON.parse(message);
		} catch (e) {
			return;
		}

		// 🏠 CREATE ROOM
		if (data.type === "create_room") {

			if (!data.room) return;

			if (rooms[data.room]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "Room already exists"
				}));

				return;
			}

			rooms[data.room] = [];

			ws.id = data.id;
			ws.name = data.name;
			ws.room = data.room;

			rooms[data.room].push(ws);

			console.log("Room created:", data.room);

			sendPlayers(data.room);

			ws.send(JSON.stringify({
				type: "room_created"
			}));

			return;
		}

		// 🚪 JOIN ROOM
		if (data.type === "join") {

			if (!rooms[data.room]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "Room not found"
				}));

				return;
			}

			ws.id = data.id;
			ws.name = data.name;
			ws.room = data.room;

			let exists = rooms[data.room].find(
				p => p.id === ws.id
			);

			if (exists) return;

			rooms[data.room].push(ws);

			console.log("Player joined:", ws.name);

			sendPlayers(data.room);

			return;
		}

		// 💬 CHAT
		if (data.type === "chat") {

			broadcast(ws.room, {
				type: "chat",
				msg: data.name + ": " + data.msg
			});
		}

		// 🚀 START GAME
		if (data.type === "start") {

			let players = rooms[ws.room].map(p => ({
				id: p.id,
				name: p.name
			}));

			broadcast(ws.room, {
				type: "start",
				players: players
			});
		}
	});

	// ❌ DISCONNECT
	ws.on("close", () => {

		if (ws.room && rooms[ws.room]) {

			rooms[ws.room] =
				rooms[ws.room].filter(
					p => p !== ws
				);

			if (rooms[ws.room].length === 0) {

				delete rooms[ws.room];

				console.log("Room deleted:", ws.room);

			} else {

				sendPlayers(ws.room);
			}
		}

		console.log("Player disconnected");
	});
});

// 📤 SEND PLAYERS
function sendPlayers(room) {

	if (!rooms[room]) return;

	let list = rooms[room].map(
		p => p.name
	);

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