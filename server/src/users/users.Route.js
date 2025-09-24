const express = require('express');
const userRoutes = express.Router();
const authMiddlewares = require('../middlewares/user.middleware.js');
const userControllers = require('../controllers/users.controller.js');
// Get user route
userRoutes.get('/get-user/:idUser', authMiddlewares.isUserAuth, userControllers.getUserByParams);

// Get all users route
userRoutes.get("/get-users", authMiddlewares.isUserAuth, authMiddlewares.isAdmin, userControllers.getAllUsers)

// Create user route
userRoutes.post('/create-user', userControllers.creatUser);

module.exports = userRoutes;
