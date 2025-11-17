import { Router } from "express";
import { generarPuntos,
    obtnerPuntos,
    registrarPuntosQR,
 } from "../controllers/points.controller.js";

const apiRouter = Router();

//! Rutas API

// ====================================================================
//? Rutas de puntos
apiRouter.post('/puntos', generarPuntos);
apiRouter.get('/puntos', obtnerPuntos);
apiRouter.post('/puntos/registrar', registrarPuntosQR);

// ====================================================================

export default apiRouter;