const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

// 👤 all registered players
let players = {};

// 🏠 fixed room
let rooms = {
	"AFA LEGENDS": []
};

wss.on("connection", (ws) => {

	console.log("✅ Player connected");

	ws.on("message", (msg) => {

		let data;

		try {

			data = JSON.parse(msg);

		} catch (e) {

			console.log("❌ Invalid JSON");
			return;
		}

		// 👤 SET PLAYER NAME
		if (data.type === "set_name") {

			let name = data.name;

			// ❌ duplicate name
			if (players[name]) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "This name already exists"
				}));

				return;
			}

			ws.name = name;
			ws.id = data.id;

			players[name] = ws;

			console.log("👤 Name registered:", name);

			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			sendAllPlayers();

			return;
		}

		// 🚪 JOIN ROOM
		if (data.type === "join_room") {

			let room = "AFA LEGENDS";

			// 🔥 room full check (10 players)
			if (rooms[room].length >= 10) {

				ws.send(JSON.stringify({
					type: "error",
					msg: "Room full"
				}));

				return;
			}

			ws.room = room;

			// ✅ avoid duplicate join
			let already = rooms[room].find(
				p => p.id === ws.id
			);

			if (!already) {

				rooms[room].push(ws);
			}

			console.log(
				"🚪 Joined room:",
				ws.name
			);

			ws.send(JSON.stringify({
				type: "room_joined"
			}));

			sendRoomPlayers(room);

			return;
		}

		// 💬 CHAT
		if (data.type === "chat") {

			if (!ws.room) return;

			broadcastRoom(ws.room, {
				type: "chat",
				name: ws.name,
				msg: data.msg
			});

			return;
		}

		// 🚀 START MESSAGE
		if (data.type === "start") {

			if (!ws.room) return;

			broadcastRoom(ws.room, {
				type: "start_message",
				name: ws.name
			});

			return;
		}
	});

	// ❌ DISCONNECT
	ws.on("close", () => {

		console.log("❌ Disconnected:", ws.name);

		// remove from player list
		if (ws.name && players[ws.name]) {

			delete players[ws.name];
		}

		// remove from room
		if (ws.room && rooms[ws.room]) {

			rooms[ws.room] =
				rooms[ws.room].filter(
					p => p !== ws
				);

			sendRoomPlayers(ws.room);
		}

		sendAllPlayers();
	});
});


// 📤 SEND ROOM PLAYERS
function sendRoomPlayers(room) {

	if (!rooms[room]) return;

	let list = rooms[room].map(
		p => p.name
	);

	broadcastRoom(room, {
		type: "players",
		list: list
	});
}


// 📤 SEND ALL PLAYERS
function sendAllPlayers() {

	let list = Object.keys(players);

	broadcastGlobal({
		type: "all_players",
		list: list
	});
}


// 📡 ROOM BROADCAST
function broadcastRoom(room, data) {

	if (!rooms[room]) return;

	let msg = JSON.stringify(data);

	rooms[room].forEach(client => {

		if (
			client.readyState ===
			WebSocket.OPEN
		) {

			client.send(msg);
		}
	});
}


// 🌍 GLOBAL BROADCAST
function broadcastGlobal(data) {

	let msg = JSON.stringify(data);

	for (let p in players) {

		if (
			players[p].readyState ===
			WebSocket.OPEN
		) {

			players[p].send(msg);
		}
	}
}

console.log("🚀 AFA LEGENDS SERVER RUNNING");