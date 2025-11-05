import { Router } from "express";
import {
    getIngredientes,
    getIngredienteById,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    getIngredientesActivos,
    enableIngrediente} from "../controllers/ingredientes.controller.js";

    const apiRouter = Router();

// ====================================================================
//? Rutas de ingredientes
apiRouter.get('/ingredientes', getIngredientes);
apiRouter.get('/ingredientes/activos', getIngredientesActivos);
apiRouter.get('/ingredientes/:id', getIngredienteById);
apiRouter.post('/ingredientes', createIngrediente);
apiRouter.put('/ingredientes/:id',updateIngrediente);
apiRouter.patch('/ingredientes/:id/habilitar', enableIngrediente);
apiRouter.delete('/ingredientes/:id',deleteIngrediente);
// ====================================================================
export default apiRouter;