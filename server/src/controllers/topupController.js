const modelTopUp = require('../models/modelTopUp.js');
const { requestDing } = require('../connections/requestDing.js');
const templateEmail = require('../senderEmail/sendEmail.js');
const { Timestamp } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');
const userMiddleware = require('../middlewares/authMiddleware.js');

function generatePriceTiers(
  minValue,
  maxValue,
  step,
  startPercent,
  endPercent
) {
  if (minValue < 0 || maxValue <= 0 || step <= 0) {
    throw new Error('Invalid price tier parameters');
  }

  const tiers = [];
  const stepsCount = Math.floor((maxValue - minValue) / step);
  const percentStep = (startPercent - endPercent) / stepsCount;

  for (let i = 0; i <= stepsCount; i++) {
    const tierMin = minValue + i * step;
    const tierMax = i === stepsCount ? Infinity : tierMin + step - 1;
    const percent = startPercent - percentStep * i;
    tiers.push({
      min: tierMin,
      max: tierMax,
      percent: Number(percent.toFixed(2)),
    });
  }
  return tiers;
}

const PRICE_TIERS = generatePriceTiers(0, 150, 10, 0.23, 0.08);

function getPercent(value, tiers = PRICE_TIERS) {
  const tier = tiers.find((t) => value >= t.min && value <= t.max);
  return tier ? tier.percent : 0;
}

function calculatePrice(value, isReverse = false, tiers = PRICE_TIERS) {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid value for calculation');
  }

  if (!isReverse) {
    const percent = getPercent(num, tiers);
    const result = num + num * percent;
    return result < 10 ? 10 : Number(result.toFixed(2));
  }

  for (const tier of tiers) {
    const original = num / (1 + tier.percent);
    if (original >= tier.min && original <= tier.max) {
      return Number(original.toFixed(2));
    }
  }
  return num;
}

// Control topup
const controlTopUp = {
  // Buscamos todos os paises
  GetCountries: async (req, res) => {
    try {
      const data_countries = await requestDing('GetCountries', 'GET');
      return res.status(200).json({
        success: true,
        ...data_countries,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //   Buscamos a operadora com o numero fornecido
  GetProviders: async (req, res) => {
    try {
      let { AccountNumber } = req.query;
      AccountNumber = AccountNumber.replace(/\D/g, '');
      const data_providers = await requestDing(
        `GetProviders?accountNumber=${AccountNumber}`,
        'GET'
      );
      return res.status(200).json({
        success: true,
        ...data_providers,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //   Buscamos todos os produtos
  GetProducts: async (req, res) => {
    try {
      let { AccountNumber, ProviderCodes } = req.query;
      AccountNumber = AccountNumber.replace(/\D/g, '');
      const data_products = await requestDing(
        `GetProducts?accountNumber=${AccountNumber}&providerCodes=${ProviderCodes}`,
        'GET'
      );
      if (data_products.ResultCode !== 1)
        throw new Error('Failed to fetch operators');

      const availableValues = {};

      data_products.Items.forEach((product) => {
        if (product.Maximum.SendValue === product.Minimum.SendValue) {
          availableValues[ProviderCodes] = {
            ...availableValues[ProviderCodes],
            [product.LocalizationKey]: {
              skuCode: product.SkuCode,
              sendValue: calculatePrice(product.Minimum.SendValue),
            },
          };
        } else if (product.Maximum.SendValue > product.Minimum.SendValue) {
          const minValue =
            calculatePrice(product.Minimum.SendValue) < 10
              ? 10
              : calculatePrice(product.Minimum.SendValue);
          const maxValue = calculatePrice(product.Maximum.SendValue);
          availableValues[ProviderCodes] = {
            ...availableValues[ProviderCodes],
            [product.LocalizationKey]: {
              skuCode: product.SkuCode,
              minValue,
              maxValue,
            },
          };
        }
      });

      res.status(200).json({ success: true, Items: availableValues });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Enviar recarga
  SendTransfer: async (req, res) => {
    try {
      // Verificamos se o device ative para realizar recarga
      if (req.body.sendValue > 250 || req.body.sendValue < 10) {
        console.log('Não pode enviar esse valor');
        return res.status(400).json({
          success: false,
          message: 'Não pode enviar esse valor',
        });
      }

      const dataValids = {};
      const requiredFields = [
        'skuCode',
        'sendValue',
        'sendCurrencyIso',
        'accountNumber',
        'validateOnly',
        'receiveCountryName',
        'operatorName',
        'receiveCurrencyIso',
        'transactionType',
      ];

      // Validação de campos obrigatórios
      const fieldNotFound = requiredFields.filter(
        (field) => req.body[field] == null
      );

      if (fieldNotFound.length > 0) {
        console.log('Faltando dados obrigatórios:', fieldNotFound.join(', '));
        return res.status(400).json({
          success: false,
          message: `Faltando dados obrigatórios: ${fieldNotFound.join(', ')}`,
        });
      }

      // Preenche apenas campos válidos
      requiredFields.forEach((f) => (dataValids[f] = req.body[f]));

      // Remove caracteres não numéricos do AccountNumber
      dataValids.accountNumber = String(dataValids.accountNumber).replace(
        /\D/g,
        ''
      );

      dataValids.validateOnly = Boolean(dataValids.validateOnly);
      const lastSolde = req.user?.soldeAccount || 0;
      const sendValue = Number(dataValids.sendValue);

      if (lastSolde < sendValue) {
        console.log('Saldo insuficiente');
        return res.status(400).json({
          success: false,
          message: 'Saldo insuficiente.',
        });
      }

      if (!dataValids.validateOnly) {
        const isPinMatch = await userMiddleware.isPinTransactionMatch(
          req.body?.pinTransaction,
          req.user
        );

        if (!isPinMatch || !req.body?.pinTransaction) {
          return res.status(401).json({
            success: false,
            message: 'Pin invalid, please check your credential and try again.',
          });
        }
      }

      const createdAt = new Date();
      dataValids.sendValueWithTax = calculatePrice(sendValue, true);

      if (!req.user.userActive) {
        return {
          success: false,
          message: 'Your account is disable!',
        };
      }

      const deviceid = req.headers.deviceid || null;
      dataValids.sendValue = parseFloat(dataValids.sendValue);
      const refTopUp = await modelTopUp.createTopUp(
        {
          ...req.user,
        },
        {
          ...dataValids,
          deviceid,
          productName: 'topup',
          distributorRef: dataValids.accountNumber,
        }
      );

      if (!refTopUp.success) {
        throw new Error(refTopUp.message);
      }

      // Enviar email
      if (dataValids.validateOnly === false) {
        await templateEmail.invoiceTopUp(
          req.user.emailUser,
          sendValue,
          refTopUp.data.amountReceived,
          dataValids.operatorName,
          dataValids.accountNumber,
          dataValids.receiveCountryName,
          refTopUp.data.statusTransaction,
          createdAt,
          refTopUp.data.transferId || dataValids.accountNumber,
          dataValids.sendCurrencyIso,
          dataValids.receiveCurrencyIso
        );
      }

      return res.status(200).json({
        success: true,
        message: refTopUp.message,
        data: {
          ...refTopUp.data,
          transferId: refTopUp.data.transferId || dataValids.accountNumber,
        },
      });
    } catch (error) {
      console.error('Erro SendTransfer:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro interno. Tente novamente!',
      });
    }
  },

  GetTopups: async (req, res) => {
    const { startDate, endDate, emailUser, pageSize, lastCreatedAt } =
      req.query;

    if (!startDate || !emailUser) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos! Informe startDate e emailUser.',
      });
    }

    const emailList = Array.isArray(emailUser) ? emailUser : [emailUser];

    try {
      const results = await Promise.all(
        emailList.map((email) =>
          modelTopUp.GetTopups({
            startDate,
            endDate,
            email,
            pageSize,
            lastCreatedAt,
          })
        )
      );

      const allItems = results.flatMap((res) => res.items || []);
      const lastVisible =
        results.find((r) => r.lastVisible)?.lastVisible || null;
      return res.status(200).json({
        success: true,
        items: allItems,
        lastVisible,
      });
    } catch (err) {
      console.error('Erro ao buscar topups:', err);
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar topups.',
      });
    }
  },
};

module.exports = controlTopUp;
