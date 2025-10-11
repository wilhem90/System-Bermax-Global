const validator = require('validator');

const validateData = {
  validateEmail: (email) => {
    if (validator.isEmail(email)) {
      return true;
    } else {
      return false;
    }
  },

  permitionUser: (roleUser) => {
    if (!['admin', 'manager'].includes(roleUser)) {
      return false;
    }
    return true;
  },

  getPathAndValue: (data) => {
    if (data?.emailUser) {
      return {
        path: 'emailUser',
        value: data.emailUser,
      };
    }

    if (data?.cpfUser) {
      return {
        path: 'cpfUser',
        value: data.cpfUser,
      };
    }

    if (data?.accountNumber) {
      return {
        path: 'accountNumber',
        value: data.accountNumber,
      };
    }
  },

  deviceIdRequired: (lasLogins, deviceidUseNow) => {
    if (!lasLogins || !deviceidUseNow) {
      return false;
    }

    if (
      lasLogins[deviceidUseNow] &&
      lasLogins[deviceidUseNow]?.active === true
    ) {
      return true;
    } else {
      return { success: false, message: 'Device session is inactive' };
    }
  },
};

module.exports = validateData;
