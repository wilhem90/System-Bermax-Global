const express = require("express")
const routers = express.Router()

routers.use("/users", require("./src/router/users.Route.js"))

module.exports = routers