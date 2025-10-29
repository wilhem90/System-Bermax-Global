const { Timestamp } = require('firebase-admin/firestore');
const userModel = require('../models/modelUser.js');
const bcrypt = require('bcrypt');
const validateData = require('../../utils/validateData.js');

const requiredFields = [
  'firstNameUser',
  'lastNameUser',
  'emailUser',
  'deviceid',
  'cpfUser',
  'phoneNumber',
  'countryUser',
  'currencyIso',
  'passwordUser',
];

const normalizeEmail = (email) => email.toLowerCase().trim();

const userControllers = {
  createUser: async (req, res) => {
    if (!req?.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Bad request!' });
    }

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    const {
      firstNameUser,
      lastNameUser,
      emailUser,
      deviceid,
      cpfUser,
      phoneNumber,
      countryUser,
      currencyIso,
      passwordUser,
    } = req.body;

    const cleanEmail = normalizeEmail(emailUser);

    if (!validateData.validateEmail(cleanEmail)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email format!' });
    }

    const accountNumber = String(
      Math.floor(Math.random() * 899999999 + 100000000)
    );

    try {
      const [emailExists, cpfExists, phoneExists, accountExists] =
        await Promise.all([
          userModel.getUser('emailUser', cleanEmail),
          userModel.getUser('cpfUser', cpfUser),
          userModel.getUser('phoneNumber', phoneNumber),
          userModel.getUser('accountNumber', accountNumber),
        ]);

      if (emailExists?.data?.idUser) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already in use.' });
      }
      if (cpfExists?.data?.idUser) {
        return res
          .status(400)
          .json({ success: false, message: 'CPF already in use.' });
      }
      if (phoneExists?.data?.idUser) {
        return res
          .status(400)
          .json({ success: false, message: 'Phone number already in use.' });
      }
      if (accountExists?.data?.idUser) {
        return res.status(400).json({
          success: false,
          message: 'Account number conflict. Try again.',
        });
      }

      const now = Timestamp.fromDate(new Date());

      const dataUser = {
        firstNameUser,
        lastNameUser,
        emailUser: cleanEmail,
        cpfUser,
        phoneNumber,
        countryUser,
        currencyIso,
        passwordUser: bcrypt.hashSync(passwordUser, 10),
        accountNumber,
        roleUser: 'client',
        additionalMinutes: '10',
        admins: [],
        lastLogins: {
          [deviceid]: {
            active: true,
            deviceName: req.headers['user-agent'] || 'Unknown',
            createdAt: now,
            updatedAt: now,
          },
        },
        soldeAccount: 0.0,
        emailVerified: false,
        userActive: true,
        accountLocked: false,
        createdAt: now,
        updatedAt: now,
      };

      const refUser = await userModel.createUser(dataUser);
      if (!refUser.success) {
        return res
          .status(500)
          .json({ success: false, message: 'Server error. Please try again!' });
      }

      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        idUser: refUser.idUser,
      });
    } catch (error) {
      console.error('CreateUser error:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Server error. Please try again!' });
    }
  },

  updateUser: async (req, res) => {
    const allowedFields = [
      'firstNameUser',
      'lastNameUser',
      'countryUser',
      'currencyIso',
      'pinTransaction',
      'lastLogins',
    ];

    const notAllowed = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field)
    );
    if (notAllowed.length > 0) {
      return res.status(400).json({
        success: false,
        message: `These fields cannot be changed: ${notAllowed.join(', ')}`,
      });
    }

    try {
      const data = { ...req.body };

      const { deviceid } = req.headers;
      if (!deviceid) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized!',
        });
      }

      if (!validateData.deviceIdRequired(req.user?.lastLogins, deviceid)) {
        return res.status(401).json({
          success: false,
          message: 'Device not authorized!',
        });
      }

      const { pinTransaction } = req.body;

      if (pinTransaction) {
        data.pinTransaction = bcrypt.hashSync(pinTransaction, 10);
      }

      data.updatedAt = Timestamp.fromDate(new Date());

      await userModel.updateUser(req.user.idUser, data);

      return res.status(200).json({ success: true, message: 'Data updated!' });
    } catch (error) {
      console.error('UpdateUser error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later!',
      });
    }
  },

  getUserByParams: async (req, res) => {
    try {
      const { emailUser, accountNumber, cpfUser } = req.query;
      if (!emailUser && !accountNumber && !cpfUser) {
        return res.status(400).json({
          success: false,
          message:
            'Can not finalizate your request check your data and try again.',
        });
      }

      const { deviceid } = req.headers;
      if (!deviceid) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized!',
        });
      }

      const { path, value } = validateData.getPathAndValue(req.query);
      const user = await userModel.getUser(path, value);
      if (!user?.data.uid) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }
      return res.status(200).json({
        success: true,
        data: {
          countryUser: user.data.countryUser,
          currencyIso: user?.data?.currencyIso,
          emailUser: user?.data?.emailUser,
          idUser: user?.data?.idUser,
          firstNameUser: user?.data?.firstNameUser,
          lastNameUser: user?.data?.lastNameUser,
          phoneNumber: user?.data?.phoneNumber,
          roleUser: user?.data?.roleUser,
          admins: user?.data?.admins,
          cpfUser: user?.data?.cpfUser,
          accountNumber: user?.data?.accountNumber,
          accountLocked: user?.data?.accountLocked,
          userActive: user?.data?.userActive,
          lastLogins: user?.data?.lastLogins,
          deviceid,
          soldeAccount: user?.data?.soldeAccount,
          additionalMinutes: user?.data?.additionalMinutes,
          urlAvatar: user?.data?.urlAvatar || null,
        },
      });
    } catch (error) {
      console.error('GetUserByParams error:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Server error. Please try again!' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      let emails = req.query.emailUser;

      // Normalize emails to array if string (comma separated)
      if (!emails) {
        return res.status(400).json({
          success: false,
          message: 'Missing "emailUser" query parameter.',
        });
      }

      if (typeof emails === 'string') {
        emails = emails.split(',').map((email) => email.trim());
      } else if (!Array.isArray(emails)) {
        return res.status(400).json({
          success: false,
          message: '"emailUser" must be a string or an array.',
        });
      }

      const users = await Promise.all(
        emails.map(async (email) => {
          const cleanEmail = normalizeEmail(email);
          const user = await userModel.getUser('emailUser', cleanEmail);

          if (!user?.data) {
            return { emailUser: cleanEmail, message: 'User not found.' };
          }

          // Check if requester has admin rights over user or is manager
          if (
            user.data.admins?.includes(req.user?.emailUser) ||
            req.user?.roleUser === 'manager'
          ) {
            return user.data;
          }

          return {
            emailUser: cleanEmail,
            message: "You don't have permission to view this user.",
          };
        })
      );

      return res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('GetAllUsers error:', error);
      return res.status(500).json({ success: false, message: 'Server error!' });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      await userModel.updateUser(req.user.idUser, {
        emailVerified: true,
        updatedAt: Timestamp.fromDate(new Date()),
      });
      return res.status(200).send('<h2>Email verified successfully!</h2>');
    } catch (error) {
      console.error('VerifyEmail error:', error);
      return res
        .status(500)
        .send('<h2>Failed to verify email. Try again later.</h2>');
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { passwordUser } = req.body;

      if (!passwordUser || passwordUser.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }

      await userModel.updateUser(req.user.idUser, {
        passwordUser: bcrypt.hashSync(passwordUser, 10),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return res
        .status(200)
        .json({ success: true, message: 'Password updated successfully!' });
    } catch (error) {
      console.error('UpdatePassword error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later!',
      });
    }
  },

  updateListDevice: async (req, res) => {
    try {
      const { deviceid } = req.body;
      if (!deviceid) {
        return res.status(400).json({
          success: false,
          message: 'Missing "deviceid" in request body',
        });
      }

      const currentLogins = req.user.lastLogins || {};
      currentLogins[deviceid] = {
        active: true,
        deviceName: req.headers['user-agent'] || 'Unknown',
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await userModel.updateUser(req.user.idUser, {
        lastLogins: currentLogins,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return res
        .status(200)
        .json({ success: true, message: 'Device updated successfully!' });
    } catch (error) {
      console.error('UpdateListDevice error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error. Please try again later!',
      });
    }
  },

  userControlAdminAndManagerOnly: async (req, res) => {
    // Middleware to allow only admin and manager to update sensitive fields

    const allowedFields = [
      'firstNameUser',
      'lastNameUser',
      'countryUser',
      'currencyIso',
      'soldeAccount',
      'userActive',
      'accountLocked',
      'additionalMinutes',
      'admins',
      'cpfUser',
      'phoneNumber',
      'roleUser',
    ];

    try {
      const notAllowed = Object.keys(req.body).filter(
        (field) => !allowedFields.includes(field)
      );
      if (notAllowed.length > 0) {
        return res.status(400).json({
          success: false,
          message: `These fields cannot be changed: ${notAllowed.join(', ')}`,
        });
      }

      if (!validateData.permitionUser(req.user?.roleUser)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Admin or Manager role required.',
        });
      }

      const refUser = await userModel.getUser(
        'emailUser',
        req.query?.emailUser
      );
      const idUser = refUser?.data?.idUser;

      if (!idUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      await userModel.updateUser(idUser, {
        ...req.body,
      });

      return res.status(200).json({
        success: true,
        message: 'User updated.',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: 'Error server, please try again!',
      });
    }
  },
};

module.exports = userControllers;
