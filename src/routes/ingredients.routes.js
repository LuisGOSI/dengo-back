import { Router } from "express";
import {
    getIngredientes,
    getIngredienteById,
    createIngrediente,
    updateIngrediente,
    deleteIngrediente,
    getIngredientesActivos,
    enableIngrediente,
    getIngredientesByCategoria,
    getIngredientesByProducto
    } from "../controllers/ingredientes.controller.js";

    const apiRouter = Router();

// ====================================================================
//? Rutas de ingredientes
apiRouter.get('/ingredientes', getIngredientes);
apiRouter.get('/ingredientes/activos', getIngredientesActivos);
apiRouter.get('/ingredientes/:id', getIngredienteById);
apiRouter.post('/ingredientes', createIngrediente);
apiRouter.put('/ingredientes/:id', updateIngrediente);
apiRouter.patch('/ingredientes/:id/habilitar', enableIngrediente);
apiRouter.delete('/ingredientes/:id', deleteIngrediente);

// Nuevas rutas para categorías y productos
apiRouter.get('/ingredientes/categoria/:idCategoria', getIngredientesByCategoria);
apiRouter.get('/ingredientes/producto/:idProducto', getIngredientesByProducto);
// ====================================================================
export default apiRouter;