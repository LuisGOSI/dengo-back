import { Router } from "express";
import ventasController from "../controllers/sales.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de ventas
apiRouter.get('/ventas', ventasController.obtenerVentas);
apiRouter.post('/ventas/registrar-venta', ventasController.registrarVenta);
apiRouter.get('/ventas/resumen', ventasController.obtenerResumenVentas);
apiRouter.get('/ventas/mas-vendidas', ventasController.obtenerProductosMasVendidos);
// ====================================================================

export default apiRouter;