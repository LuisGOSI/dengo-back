import { Router } from "express";
import {
    generarPuntos,
    rutaPrueba,
    registrarPuntosQR,
} from "../controllers/points.controller.js";

const apiRouter = Router();

//! Rutas API

// ====================================================================
//? Rutas de puntos
apiRouter.post('/puntos', generarPuntos);
apiRouter.get('/puntos', rutaPrueba);
apiRouter.post('/puntos/registrar', registrarPuntosQR);

// ====================================================================

export default apiRouter;