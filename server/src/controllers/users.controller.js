const { Timestamp } = require('firebase-admin/firestore');
const userModel = require('../models/user.model.js');
const bcrypt = require('bcrypt');
const userControllers = {
	// Let get user by: emailUser || cpfUser || accountNumber
	getUserByParams: async (req, res) => {
		const value = req.params.idUser;
		if (!value) {
			return res.status(404).json({
				success: true,
				message: 'Bad request!',
			});
		}
		const user = await userModel.getUser(value);
		return res.status(200).json({
			success: true,
			data: {
				countryUser: user.data.countryUser,
				countryUser: user.data.countryUser,
				currencyIso: user.data.currencyIso,
				emailUser: user.data.emailUser,
				firstNameUser: user.data.firstNameUser,
				lastNameUser: user.data.lastNameUser,
				phoneNumber: user.data.phoneNumber,
				roleUser: user.data.roleUser,
				admins: user.data.admins,
				cpfUser: user.data.cpfUser,
				accountNumber: user.data.accountNumber,
				acountLocked: user.data.acountLocked,
				userAcitve: user.data.userAcitve,
				lastLogins: user.data.lastLogins,
				soldeAccount: user.data.soldeAccount,
				additionalMinutes: user.data.additionalMinutes,
				active: user.data.active,
			},
		});
	},

	// Let's create a new user
	creatUser: async (req, res) => {
		if (!req?.body || typeof req.body != 'object') {
			return res.status(400).json({
				success: false,
				message: 'Bad request!',
			});
		}
		try {
			const { firstNameUser, lastNameUser, emailUser, cpfUser, phoneNumber, countryUser, currencyIso, passwordUser } = req.body;
			const fieLds = [];
			['firstNameUser', 'lastNameUser', 'emailUser', 'cpfUser', 'phoneNumber', 'countryUser', 'currencyIso', 'passwordUser'].forEach(
				(field) => {
					if (!req.body?.[field]) {
						fieLds.push(field);
					}
					return;
				}
			);
			if (fieLds.length > 0) {
				return res.status(400).json({
					success: false,
					message: `Data required: ${fieLds}`,
				});
			}

			const accountNumber = String(Math.floor(Math.random() * 999999999 + 100000000));
			const emailUserExist = await userModel.getUser('emailUser', emailUser.toLowerCase());
			const cpfUserExist = await userModel.getUser('cpfUser', cpfUser);
			const phoneNumberExist = await userModel.getUser('phoneNumber', phoneNumber);
			const accountNumberExist = await userModel.getUser('accountNumber', accountNumber);

			const userExist =
				emailUserExist?.data?.emailUser ||
				cpfUserExist?.data?.cpfUser ||
				phoneNumberExist?.data?.phoneNumber ||
				accountNumberExist?.data?.accountNumber ||
				false;

			if (!!userExist) {
				return res.status(400).json({
					success: false,
					message: `An account has been created with: ${userExist}`,
				});
			}

			const dataUser = {
				firstNameUser,
				lastNameUser,
				emailUser,
				cpfUser,
				phoneNumber,
				countryUser,
				currencyIso,
				passwordUser: bcrypt.hashSync(passwordUser, 10),
				accountNumber,
				roleUser: 'client',
				additionalMinutes: '10',
				admins: [],
				soldeAccount: parseFloat('0.00'),
				emailVerified: Boolean(false),
				userActive: Boolean(false),
				acountLocked: Boolean(false),
				createdAt: Timestamp.fromDate(new Date()),
				updatedAt: Timestamp.fromDate(new Date()),
			};

			const refUser = await userModel.createUser(dataUser);
			if (!refUser.success) {
				throw new Error('Error server please try again!');
			}
			return res.status(201).json({
				success: true,
                message: "Account created successfully.",
				idUser: refUser.idUser,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				success: false,
				message: 'Error server!',
			});
		}
	},
};

module.exports = userControllers;
