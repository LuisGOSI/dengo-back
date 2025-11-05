import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js'];

const doc = {
    info: {
        title: 'Dengo API',
        description: 'API para Dengo.',
        version: '1.0.0',
    },
    host: 'localhost:3000',
    schemes: ['http']
};

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger documentation generated successfully.');
});