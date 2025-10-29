const express = require('express');
const controllerTransferMoney = require('../controllers/transferController.js');
const userMiddleware = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.post(
  '/create-transaction',
  userMiddleware.isUserAuth,
  controllerTransferMoney.createTransfer
);

router.get(
  '/get-beneficiary/:accountNumber',
  userMiddleware.isUserAuth,
  controllerTransferMoney.getBeneficiary
);

module.exports = router;
