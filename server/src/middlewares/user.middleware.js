const jwt = require('jsonwebtoken');
const userMiddleware = {
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
};

module.exports = userMiddleware;
