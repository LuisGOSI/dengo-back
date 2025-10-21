var express = require('express');
var cors = require('cors');
var dotenv = require('dotenv');

dotenv.config();

//* Iniciación de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

//* Aplicación de middlewares
app.use(cors());
app.use(express.json());

//* Rutas de la aplicación
app.get('/', (req, res) => {
    res.json({
        message: 'El api de Dengo está funcionando correctamente.',
        version: "1.0.0",
        status: "online"
    });
});


//* Inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});