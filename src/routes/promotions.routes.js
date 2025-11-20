import { Router } from "express";
import {
    getPromociones,
    getPromocionById,
    createPromocion,
    updatePromocion,
    deletePromocion,
    getPromocionesActivas,
    getPromocionesVigentes,
    enablePromocion,
    getPromocionesByTipo,
    getPromocionesByNivel
} from "../controllers/promotions.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de promociones
apiRouter.get('/promociones', getPromociones);
apiRouter.get('/promociones/activas', getPromocionesActivas);
apiRouter.get('/promociones/vigentes', getPromocionesVigentes);
apiRouter.get('/promociones/:id', getPromocionById);
apiRouter.post('/promociones', createPromocion);
apiRouter.put('/promociones/:id', updatePromocion);
apiRouter.patch('/promociones/:id/habilitar', enablePromocion);
apiRouter.delete('/promociones/:id', deletePromocion);

// Rutas para filtros específicos
apiRouter.get('/promociones/tipo/:tipo', getPromocionesByTipo);
apiRouter.get('/promociones/nivel/:idNivel', getPromocionesByNivel);
// ====================================================================

export default apiRouter;