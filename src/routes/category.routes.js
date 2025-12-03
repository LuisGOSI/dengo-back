import { Router } from "express";
import { getCategories } from "../controllers/category.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de categorías
apiRouter.get('/categorias', getCategories);

// ====================================================================

export default apiRouter;