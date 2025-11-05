import { Router } from "express";
import {
    getSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    toggleSucursalActiva
    
} from "../controllers/branch.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de sucursales
apiRouter.get('/sucursales', getSucursales);
apiRouter.get('/sucursales/:id', getSucursalById);
apiRouter.post('/sucursales', createSucursal);
apiRouter.put('/sucursales/:id', updateSucursal);
apiRouter.patch('/sucursales/activa/:id', toggleSucursalActiva);
// ====================================================================

export default apiRouter;
