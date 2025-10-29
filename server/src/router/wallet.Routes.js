const express = require('express');
const walletController = require('../controllers/walletController.js');
const userMiddleware = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.post(
  '/deposit',
  userMiddleware.isUserAuth,
  walletController.depositToMyAccount
);
router.post(
  '/withdraw',
  userMiddleware.isUserAuth,
  walletController.withdrawFunds
);
router.post('/transfer', walletController.transferFunds);

module.exports = router;
