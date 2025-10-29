const { db, Timestamp } = require('../connections/firebase');
const transferModel = require('../models/modelTransfer');
const userModel = require('../models/modelUser');
require('dotenv').config();

function calcularTaxa(valor) {
  if (valor < 150) return 22;
  if (valor < 300) return valor * 0.09;
  return valor * 0.08;
}

const controllerTransferMoney = {
  createTransfer: async (req, res) => {
    try {
      const userData = req.user;
      let rate;
      let fee;

      const timeOut = Math.floor(Math.random() * (5000 - 2000) + 2000);
      const {
        sendValue,
        accountNumber,
        operatorName,
        fullNameBeneficiary,
        receiveCurrencyIso,
        validateOnly = true,
      } = req.body;

      const { deviceid } = req.headers;
      const { taxExchange, minVal, maxVal, taxFix, percent_commi } =
        await userModel.getCongigApp('transfermoney');

      rate = taxExchange?.rateExchange;

      if (
        !sendValue ||
        isNaN(sendValue) ||
        sendValue <= 0 ||
        sendValue === '' ||
        sendValue === null ||
        sendValue === undefined ||
        sendValue < minVal ||
        sendValue > maxVal
      ) {
        return res.status(400).json({
          success: false,
          message: 'Deve informar umm valor valido: min 80, max 350',
        });
      }
      fee = calcularTaxa(sendValue);
      const updatedAt = new Date(taxExchange?.updatedAt?.toDate());
      const now = new Date();

      const diffInMs = now - updatedAt;
      const diffInDay = diffInMs / (1000 * 60 * 60 * 24); // ms -> h

      const isMoreThanOneDay = diffInDay > 1;

      if (isMoreThanOneDay) {
        const exchangeRate = await fetch(
          `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_KEY}/latest/brl`
        );

        if (exchangeRate.ok) {
          const conversion_json = await exchangeRate.json();
          rate = conversion_json.conversion_rates.HTG;
          await userModel.updateAppConfig('transfermoney', {
            taxExchange: {
              updatedAt: Timestamp.fromDate(new Date()),
              rateExchange: rate,
            },
          });
        }
      }
      const estimated =
        (parseFloat(sendValue) - calcularTaxa(sendValue)) * rate;

      if (validateOnly) {
        let timeOutId;
        timeOutId = setTimeout(() => {
          return res.status(200).json({
            success: true,
            estimated,
            sendValueWithTax: rate - taxFix,
            sendValueDiscount: sendValue - rate + taxFix,
          });
        }, timeOut);
        return () => clearTimeout(timeOutId);
      }

      if (
        !sendValue ||
        !accountNumber ||
        !operatorName ||
        !fullNameBeneficiary
      ) {
        return res.status(400).json({
          success: false,
          message: 'Deve enviar todos os dados para finalizar a transferencia.',
        });
      }
      const transactionId = await transferModel.createTransfer(
        { ...userData },
        {
          type: 'cash-out',
          createdBy: userData.emailUser,
          sendCountryName: userData.countryUser,
          receiveCountryName: 'Haiti',
          sendCurrencyIso: userData.currencyIso,
          receiveCurrencyIso: receiveCurrencyIso || 'HTG',
          fullNameBeneficiary: fullNameBeneficiary.toLowerCase(),
          accountNumber,
          sendValue: parseFloat(sendValue).toFixed(2),
          receiveValue: parseFloat(estimated).toFixed(2),
          operatorName,
          taxFix,
          fee,
          commission: (parseFloat(fee) * parseFloat(percent_commi)).toFixed(2),
          productName: 'cash-money',
          status: 'pending',
          deviceid,
        }
      );

      if (!transactionId.success) {
        return res.status(400).json({
          success: false,
          message: transactionId.message,
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Transação realizada com successo!',
        data: transactionId.data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  getBeneficiary: async (req, res) => {
    try {
      const accountNumber = req.params.accountNumber;
      if (!accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Número da conta é obrigatório',
        });
      }

      const resquestBene = await transferModel.getBeneficiary(accountNumber);
      console.log(resquestBene);
      return res.status(200).json({
        success: true,
        beneficiary: resquestBene?.data || 'Receeeee',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = controllerTransferMoney;
