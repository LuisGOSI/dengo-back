import { Router } from "express";
import { getCommunityFeed, getMyCreations, createCreation, deleteCreation, aprobarCreation, getPendingCreations, rechazarCreation } from "../controllers/community.controller.js";

const apiRouter = Router();


// ====================================================================
//? Rutas de comunidad
apiRouter.get('/comunidad/feed', getCommunityFeed);
apiRouter.get('/comunidad/usuario/:usuario_id', getMyCreations);
apiRouter.post('/comunidad', createCreation);
apiRouter.post('/comunidad/eliminar', deleteCreation); // Usamos POST para eliminar con body
apiRouter.post('/comunidad/aprobar', aprobarCreation);
apiRouter.get('/comunidad/pendientes', getPendingCreations);
apiRouter.post('/comunidad/rechazar', rechazarCreation);
// ====================================================================

export default apiRouter;