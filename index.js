import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUI from 'swagger-ui-express';
import fs from 'fs';
import userRoutes from './src/routes/users.routes.js';
import productRoutes from './src/routes/products.routes.js';
import branchRoutes from './src/routes/branch.routes.js';
import eventsRoutes from './src/routes/events.routes.js';
import ingredientRoutes from './src/routes/ingredients.routes.js';
import pedidosRoutes from './src/routes/pedidos.routes.js';
import pointsRoutes from './src/routes/points.routes.js';
import salesRoutes from './src/routes/sales.routes.js';

//? Carga de la documentación Swagger
const swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json'));

//? Configuración de variables de entorno
dotenv.config();

//? Puerto de la aplicación
const PORT = process.env.PORT || 3000;

//? Iniciación de la aplicación Express
const app = express();

//? Aplicación de middlewares
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));


//? Inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//? Rutas de la aplicación
app.get('/', (req, res) => {
    res.json({
        message: 'El api de Dengo está funcionando correctamente.',
        version: "1.0.0",
        status: "online"
    });
});

//? Rutas del API
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', branchRoutes);
app.use('/api', eventsRoutes);
app.use('/api', ingredientRoutes);
app.use('/api', pedidosRoutes);
app.use('/api', pointsRoutes)
app.use('/api', salesRoutes)
