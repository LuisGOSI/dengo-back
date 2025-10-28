import { Router } from "express";
import {
    getProductos,
    getProductosActivos,
    getProductoById,
    getProductosByCategoria,
    createProducto,
    updateProducto,
    habilitarProducto,
    deshabilitarProducto,
    deleteProducto
} from "../controllers/productos.controller.js";

const apiRouter = Router();

// ====================================================================
//? Rutas de productos
apiRouter.get('/productos', getProductos)
apiRouter.get('/productos/activos', getProductosActivos);
apiRouter.get('/productos/:id', getProductoById);
apiRouter.get('/productos/categoria/:categoria', getProductosByCategoria);
apiRouter.post('/productos', createProducto);
apiRouter.put('/productos/:id', updateProducto);
apiRouter.patch('/productos/habilitar/:id', habilitarProducto);
apiRouter.patch('/productos/deshabilitar/:id', deshabilitarProducto);
apiRouter.delete('/productos/:id', deleteProducto);
// ====================================================================

export default apiRouter;