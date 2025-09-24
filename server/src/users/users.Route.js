const express = require('express');
const userRoutes = express.Router();
const authMiddlewares = require('../middlewares/user.middleware.js');
const userControllers = require('../controllers/users.controller.js');
userRoutes.get('/get-user/:idUser', authMiddlewares.isUserAuth, userControllers.getUserByParams);
userRoutes.post('/create-user', userControllers.creatUser);

module.exports = userRoutes;
