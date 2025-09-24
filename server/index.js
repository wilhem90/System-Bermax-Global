require("dotenv").config()
const express = require('express');
const app = express();
const routers = require("./central.Routes.js")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routers)

const port = process.env.PORT

app.listen(port, () => {
	console.log(`http://localhost:${port}/api`);
});
