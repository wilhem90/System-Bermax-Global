const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const userModel = require('../models/modelUser');
const { Timestamp } = require('firebase-admin/firestore');
const templateEmail = require('../senderEmail/sendEmail');
const validateData = require('../../utils/validateData');

async function checkIfUserExist(emailUser) {
  // Ajuste o argumento para corresponder ao seu método getUser
  const user = await userModel.getUser('emailUser', emailUser.toLowerCase());
  return user;
}

async function checkIfTokenStillValid(token) {
  let isValidToken = false;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_KEY);
      isValidToken = true;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        isValidToken = false;
      }
    }
  }

  if (isValidToken) {
    return {
      success: false,
      message: 'Check your email inbox. Token is still valid.',
    };
  } else {
    return {
      success: true,
    };
  }
}

const userMiddleware = {
  // Criar token (login)
  createToken: async (req, res) => {
    if (!req?.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Bad request!' });
    }
    
    try {
      const { emailUser, passwordUser, expiresAt } = req.body;
      const { deviceid } = req.headers;

      if (!emailUser || !deviceid || deviceid === 'undefined') {
        return res
          .status(400)
          .json({ success: false, message: 'Not authorized!' });
      }

      if (!validateData.validateEmail(emailUser)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid email format!' });
      }

      const userExist = await checkIfUserExist(emailUser);

      if (!userExist?.data?.emailUser) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found.' });
      }

      let isMatch = false;

      if (passwordUser) {
        isMatch = bcrypt.compareSync(passwordUser, userExist.data.passwordUser);
      } else if (deviceid) {
        isMatch = Boolean(userExist.data.lastLogins?.[deviceid]);
      }

      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: 'Credentials incorrect!' });
      }

      const payload = {
        emailUser: userExist.data.emailUser,
      };
      // expiresAt ||

      const expiresIn = expiresAt || '1m';

      const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn });

      // Se o device não está ativo, ativar (true) e atualizar no DB
      const isActive = userExist?.data?.lastLogins?.[deviceid]?.active || false;

      await userModel.updateUser(userExist.data.uid, {
        lastLogins: {
          ...userExist?.data?.lastLogins,
          [deviceid]: {
            active: isActive, // Ativando dispositivo
            deviceName: req.headers['user-agent'],
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          },
        },
      });

      req.user = {
        token,
        countryUser: userExist.data.countryUser,
        currencyIso: userExist.data.currencyIso,
        emailUser: userExist.data.emailUser,
        firstNameUser: userExist.data.firstNameUser,
        lastNameUser: userExist.data.lastNameUser,
        phoneNumber: userExist.data.phoneNumber,
        roleUser: userExist.data.roleUser,
        admins: userExist.data.admins,
        cpfUser: userExist.data.cpfUser,
        accountNumber: userExist.data.accountNumber,
        accountLocked: userExist.data.accountLocked,
        userActive: userExist.data.userActive,
        lastLogins: userExist.data.lastLogins,
        soldeAccount: userExist.data.soldeAccount,
        additionalMinutes: userExist.data.additionalMinutes,
        deviceid,
      };
      return res.status(200).json({ success: true, token, ...req.user });
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, message: 'Server error, please try again!' });
    }
  },

  // Middleware para verificar autenticação do usuário
  isUserAuth: async (req, res, next) => {
    try {
      const token =
        req.headers?.authorization?.split(' ')?.[1] || req.query.token;
      const { deviceid } = req.headers;
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: 'Not authorized!' });
      }

      const verify = jwt.verify(token, process.env.JWT_KEY);
      const emailUser = verify?.emailUser;

      const userLogged = await checkIfUserExist(emailUser);

      if (!userLogged || !deviceid) {
        return res
          .status(403)
          .json({ success: false, message: 'Access Denied You don’t have permission to access!' });
      }

      req.user = { ...userLogged.data, deviceid };
      next();
    } catch (error) {
      console.error(error.message);
      return res.status(401).json({ success: false, message: error.message });
    }
  },

  // Verificamos se o pin esta ok para finalizar a transacao do usuario
  isPinTransactionMatch: async (pinTransaction, data) => {
    const isMatch = bcrypt.compareSync(pinTransaction, data?.pinTransaction);
    return isMatch;
  },

  // Middleware para verificar se é admin ou manager
  isAdmin: async (req, res, next) => {
    const { deviceid } = req.headers;
    const user = req.user;

    const isNotAdminOrManager = !['admin', 'manager'].includes(user?.roleUser);
    const isInactive = user?.userActive === false;
    const isLocked = user?.accountLocked === true;
    const isDeviceInactive = !(user?.lastLogins?.[deviceid]?.active === true);

    const reasons = [];
    if (isNotAdminOrManager) reasons.push('Not an admin or manager');
    if (isInactive) reasons.push('User is inactive');
    if (isDeviceInactive) reasons.push('Device session is inactive');
    if (isLocked) reasons.push('Account is locked');

    if (reasons.length > 0) {
      return res.status(401).json({
        success: false,
        message: `Access denied: ${reasons.join(', ')}.`,
      });
    }

    next();
  },

  // Enviar link para validar email
  tokenValidateEmail: async (req, res) => {
    try {
      const { emailUser, firstNameUser, uid, listTokens } = req.user;

      const emailToken = listTokens?.emailverifiedToken;

      if (emailToken) {
        const response = await checkIfTokenStillValid(emailToken);
        if (!response.success) {
          return res.status(200).json({
            success: true,
            message: response.message,
          });
        }
      }

      // Gerar novo token
      const confirmToken = jwt.sign({ emailUser }, process.env.JWT_KEY, {
        expiresIn: '1h',
      });

      // Atualizar usuário com novo token
      await userModel.updateUser(uid, {
        listTokens: {
          ...listTokens,
          emailverifiedToken: confirmToken,
        },
      });

      const linkValidateEmail = `${process.env.APP_URL_FRONT}/auth/validate-email?token=${confirmToken}`;
      // Enviar email de confirmação
      await templateEmail.validateEmailUser({
        emailUser,
        firstNameUser,
        linkValidateEmail,
        subject: 'Confirmação de E-mail',
        ignoreMail: 'criou uma conta',
        messageAction: 'Obrigado por se cadastrar. Para confirmar seu e-mail',
        textBtn: 'Confirmar e-mail',
      });

      return res.status(200).json({
        success: true,
        linkValidateEmail,
      });
    } catch (error) {
      console.error('Algo deu errado! ', error);
      return res.status(500).json({
        success: false,
        message: 'Erro no servidor. Tente novamente mais tarde.',
      });
    }
  },

  // Enviar link para redefinir senha (forgot password)
  tokenForgetPassword: async (req, res) => {
    try {
      const { emailUser } = req.body;
      if (!emailUser) {
        return res
          .status(400)
          .json({ success: false, message: 'Email required!' });
      }

      const passwordToken = listTokens?.passwordToken;

      if (passwordToken) {
        const response = await checkIfTokenStillValid(passwordToken);
        if (!response.success) {
          return res.status(200).json({
            success: true,
            message: response.message,
          });
        }
      }

      const tokenForgetPassword = jwt.sign({ emailUser }, process.env.JWT_KEY, {
        expiresIn: '15m',
      });

      // Atualizar usuário com novo token
      await userModel.updateUser(uid, {
        listTokens: {
          ...listTokens,
          passwordToken: tokenForgetPassword,
        },
      });

      const linkUpdatePassword = `${process.env.APP_URL_FRONT}/auth/new-password?token=${tokenForgetPassword}`;
      await templateEmail.validateEmailUser({
        emailUser,
        firstNameUser,
        linkUpdatePassword,
        subject: 'Validar aparelho',
        ignoreMail: 'valida aparelho',
        messageAction:
          'Para usar esse novo aparelho, deve validar o mesmo no link abaixo.',
        textBtn: 'Validar aparelho!',
      });

      return res.status(200).json({ success: true, linkUpdatePassword });
    } catch (error) {
      console.error('Algo deu errado! ' + error);
      return res.status(500).json({
        success: false,
        message: 'Server error, please try again later!',
      });
    }
  },

  // Enviar link para validar novo dispositivo
  tokenValidateDevice: async (req, res) => {
    try {
      const { emailUser, firstNameUser } = req.user;
      const passwordToken = listTokens?.validateDeviceToken;

      if (validateDeviceToken) {
        const response = await checkIfTokenStillValid(validateDeviceToken);
        if (!response.success) {
          return res.status(200).json({
            success: true,
            message: response.message,
          });
        }
      }

      const validateDeviceToken = jwt.sign({ emailUser }, process.env.JWT_KEY, {
        expiresIn: '15m',
      });

      // Atualizar usuário com novo token
      await userModel.updateUser(uid, {
        listTokens: {
          ...listTokens,
          validateDeviceToken: validateDeviceToken,
        },
      });

      const linkValidateDeviceToken = `${process.env.APP_URL_FRONT}/auth/validate-device?token=${validateDeviceToken}`;
      await templateEmail.validateEmailUser({
        emailUser,
        firstNameUser,
        linkValidateDeviceToken,
        subject: 'Validar aparelho',
        ignoreMail: 'valida aparelho',
        messageAction:
          'Para usar esse novo aparelho, deve validar o mesmo no link abaixo.',
        textBtn: 'Validar aparelho!',
      });

      return res.status(200).json({ success: true, linkValidateDeviceToken });
    } catch (error) {
      console.error('Algo deu errado! ' + error);
      return res.status(500).json({
        success: false,
        message: 'Server error, please try again later!',
      });
    }
  },
};

module.exports = userMiddleware;
