import { Router } from 'express';
import pedidosController from '../controllers/pedidos.controller.js';

const apiRouter = Router();

apiRouter.post('/pedidos', pedidosController.crearPedido);
apiRouter.get('/pedidos', pedidosController.obtenerPedidos);
apiRouter.get('/pedidos/usuario/:usuario_id', pedidosController.obtenerPedidosPorUsuario);
apiRouter.get('/pedidos/:id', pedidosController.obtenerPedidoPorId);
apiRouter.put('/pedidos/:id/estado', pedidosController.actualizarEstadoPedido);
apiRouter.put('/pedidos/:id/cancelar', pedidosController.cancelarPedido);

export default apiRouter;
