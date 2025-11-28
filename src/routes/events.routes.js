import { Router } from "express";
import {
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  getEventosBySucursal,
  confirmarAsistencia
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
apiRouter.post('/eventos/confirmar-asistencia', confirmarAsistencia);
// ====================================================================

export default apiRouter;
