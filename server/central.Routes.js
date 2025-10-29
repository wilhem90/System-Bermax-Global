const express = require('express');
const routers = express.Router();

routers.use('/users', require('./src/router/user.Routes.js'));
routers.use('/topup', require('./src/router/topup.Routes.js'));
routers.use('/wallet', require('./src/router/wallet.Routes.js'));
routers.use('/transfer', require('./src/router/transferMoney.Routes.js'));

module.exports = routers;