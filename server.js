const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const Database = require("@replit/database");
const db = new Database();
var bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", urlencodedParser, async function (req, res) {
	const username = req.body.username;
	const id = uuidv4();

	const users =
		(await db
			.get("users")
			.then((value) => value.json().then((json) => json))
			.catch(() => {
				return null;
			})) || [];

	users.push({ username: username, _id: id });

	db.set("users", users).then(() => {
		res.json({
			username,
			_id: id,
		});
	});
});

app.get("/api/users", async function (req, res) {
	const users = await db.get("users");
	res.send(users);
});

app.post(
	"/api/users/:_id/exercises",
	urlencodedParser,
	async function (req, res) {
		const { description, duration, date } = req.body;
		const _id = req.params._id;
		const users = await db.get("users");
		const index = users.findIndex((user) => user._id === _id);
		let log = users[index].log || [];
		log.push({
			description,
			duration: parseInt(duration),
			date: date ? new Date(date).toDateString() : new Date().toDateString(),
		});
		users[index].log = log;
		db.set("users", users).then(() => {
			const response = {
				username: users[index].username,
				description: users[index].log[users[index].log.length - 1].description,
				duration: parseInt(
					users[index].log[users[index].log.length - 1].duration
				),
				date: users[index].log[users[index].log.length - 1].date,
				_id: _id,
			};

			res.json(response);
		});
	}
);

app.get("/api/users/:_id/logs", urlencodedParser, async function (req, res) {

	const { from, to, limit } = req.query;

	const _id = req.params._id;
	const users = await db.get("users");

	const user = users.find((user) => (user._id = _id));

	let log = user.log;

	if (from) {
		const fromDate = new Date(from);
		log = log.filter((exe) => new Date(exe.date) > fromDate);
	}

	if (to) {
		const toDate = new Date(to);
		log = log.filter((exe) => new Date(exe.date) < toDate);
	}

	if (limit) {
		log = log.splice(0, limit);
	}

	const response = {
		username: user.username,
		count: log.length,
		_id: user._id,
		log: log,
	};

	res.json(response);
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
