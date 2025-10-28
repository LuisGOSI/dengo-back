import { Router } from "express";
import { getUsers } from "../controllers/users.controller.js";

const apiRouter = Router();

//! Rutas API

// ====================================================================
//? Rutas de usuarios
apiRouter.get('/usuarios', getUsers);
// ====================================================================

export default apiRouter;