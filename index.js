import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './src/routes/users.routes.js';
import productRoutes from './src/routes/products.routes.js';
import ingredientRoutes from './src/routes/ingredients.routes.js';

//? Configuración de variables de entorno
dotenv.config();

//? Puerto de la aplicación
const PORT = process.env.PORT || 3000;

//? Iniciación de la aplicación Express
const app = express();

//? Aplicación de middlewares
app.use(cors());
app.use(express.json());

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
app.use('/api', ingredientRoutes);
