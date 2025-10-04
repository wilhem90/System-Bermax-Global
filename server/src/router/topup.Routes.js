const express = require('express');
const controlTopUp = require('../controllers/controlTopup.js');
const userMiddleware = require('../middlewares/authMiddleware.js');
const routerTopup = express.Router();

routerTopup.get(
  '/countries',
  userMiddleware.isUserAuth,
  controlTopUp.GetCountries
);
routerTopup.get(
  '/providers',
  userMiddleware.isUserAuth,
  controlTopUp.GetProviders
);
routerTopup.get(
  '/products',
  userMiddleware.isUserAuth,
  controlTopUp.GetProducts
);
routerTopup.post(
  '/create-topup',
  userMiddleware.isUserAuth,
  controlTopUp.SendTransfer
);
routerTopup.get('/get-topups', controlTopUp.GetTopups);
module.exports = routerTopup;
