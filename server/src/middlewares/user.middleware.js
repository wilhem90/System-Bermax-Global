const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

async function checkIfuserExist(emailUser) {
  return await userModel.getUser('emailUser', emailUser);
}

const userMiddleware = {
  // Let's create token
  createToken: async (req, res) => {
    try {
      const { emailUser, passwordUser } = req.body;
      const userExist = await checkIfuserExist('emailUser', emailUser);
      return res.status(200).json({
        success: true,
        ...userExist.data,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: 'Error iserver please try again!',
      });
    }
  },

  // CHeck if an authentic user
  isUserAuth: (req, res, next) => {
    const { deviceid } = req.headers;
    const token = req.headers.authorization.split('')[1];
    if (!token || !deviceid) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized!',
      });
    }

    next();
  },

  //   CHeck if an admin user
  isAdmin: async (req, res, next) => {
    const admin = req.userLogged?.roleUser === 'admin';
    if (
      !admin ||
      !req.userLogged?.userActive ||
      req.userLogged?.accountLocked
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized!',
      });
    }

    next();
  },
};

module.exports = userMiddleware;
