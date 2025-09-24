const express = require("express")
const routers = express.Router()

routers.use("/users", require("./src/users/users.Route.js"))

module.exports = routers