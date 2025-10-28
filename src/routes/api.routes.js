import { Router } from "express";
import { getUsers } from "../controllers/users.controller.js";

const apiRouter = Router();

//? Rutas del API
apiRouter.get('/users', getUsers);

export default apiRouter;