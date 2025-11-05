import { Router } from "express";
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  getEventosBySucursal
} from "../controllers/events.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de eventos
apiRouter.get('/eventos', getEventos);
apiRouter.get('/eventos/:id', getEventoById);
apiRouter.post('/eventos', createEvento);
apiRouter.put('/eventos/:id', updateEvento);
apiRouter.delete('/eventos/:id', deleteEvento);
apiRouter.get('/eventos/sucursal/:sucursal_id', getEventosBySucursal);
// ====================================================================

export default apiRouter;
