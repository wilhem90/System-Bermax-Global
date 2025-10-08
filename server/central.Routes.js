const express = require("express")
const routers = express.Router()

routers.use("/users", require("./src/router/users.Route.js"))
routers.use("/topup", require("./src/router/topup.Routes.js"))

module.exports = routers