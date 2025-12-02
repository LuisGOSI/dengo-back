import { Router } from "express";
import { getUsers,
    getUserById,
    updateUser,
    deleteUser,
    createUser
 } from "../controllers/users.controller.js";

const apiRouter = Router();

//! Rutas API

// ====================================================================
//? Rutas de usuarios
apiRouter.get('/usuarios', getUsers);
apiRouter.get('/usuarios/:id', getUserById);
apiRouter.post('/usuarios', createUser);
apiRouter.put('/usuarios/:id', updateUser);
apiRouter.delete('/usuarios/:id', deleteUser);
// ====================================================================

export default apiRouter;