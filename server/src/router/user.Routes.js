const express = require('express');
const userRoutes = express.Router();

const authMiddlewares = require('../middlewares/authMiddleware.js');
const userControllers = require('../controllers/userController.js');

// Criar novo usuário
userRoutes.post('/create-user', userControllers.createUser);

// Login - gerar token
userRoutes.post('/login', authMiddlewares.createToken);

// Buscar usuário por ID
userRoutes.get(
  '/get-user',
  authMiddlewares.isUserAuth,
  userControllers.getUserByParams
);

// Atualizar dados do usuário
userRoutes.put(
  '/update-user/:id',
  authMiddlewares.isUserAuth,
  userControllers.updateUser
);

// Listar todos os usuários (admin)
userRoutes.get(
  '/get-users',
  authMiddlewares.isUserAuth,
  authMiddlewares.isAdmin,
  userControllers.getAllUsers
);

// Enviar link para validar email
userRoutes.post(
  '/link-validate-email',
  authMiddlewares.isUserAuth,
  authMiddlewares.tokenValidateEmail
);

// Verificar/confirmar email
userRoutes.get(
  '/verify-email',
  authMiddlewares.isUserAuth,
  userControllers.verifyEmail
);

// Enviar link para redefinição de senha (sem autenticação, pois é para recuperar acesso)
userRoutes.post('/link-forget-password', authMiddlewares.tokenForgetPassword);

// Atualizar senha
userRoutes.put(
  '/update-password',
  authMiddlewares.isUserAuth,
  userControllers.updatePassword
);

// Enviar link para validar novo dispositivo
userRoutes.post(
  '/link-validate-device',
  authMiddlewares.isUserAuth,
  authMiddlewares.tokenValidateDevice
);

// Atualizar lista de dispositivos do usuário
userRoutes.put(
  '/validate-device',
  authMiddlewares.isUserAuth,
  userControllers.updateListDevice
);

// Atualizar conta do usuario pelo admin ou manager
userRoutes.put(
  '/mater-control-users',
  authMiddlewares.isUserAuth,
  userControllers.userControlAdminAndManagerOnly
);

module.exports = userRoutes;
