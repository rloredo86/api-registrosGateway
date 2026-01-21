const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const basicAuth = require('express-basic-auth');

const app = express();

// --- CONFIGURACIÓN FIJA (HARDCODED) ---
const PORT = 3000;

// Credenciales
const API_USER = 'admin';
const API_PASSWORD = 'passwordSeguro123';

// URLs de los Microservicios (Ajusta estos valores según tus servicios reales)
const URL_SERVICE_USERS = 'https://api-registros-reg.vercel.app/';
const URL_SERVICE_CODES = 'https://api-registros-codigo.vercel.app/';
const URL_SERVICE_CONFIRM = 'https://api-registro-confirmacion.vercel.app/';
// --------------------------------------

// 1. Seguridad Básica Global
// Protege la entrada al Gateway antes de decidir a qué servicio ir
app.use(basicAuth({
    users: { [API_USER]: API_PASSWORD },
    challenge: true
}));

// Helper para opciones comunes (DRY - Don't Repeat Yourself)
const getProxyOptions = (targetUrl) => ({
    target: targetUrl,
    changeOrigin: true, // Vital para servicios en la nube/virtual hosts
    onError: (err, req, res) => {
        console.error(`Error conectando a ${targetUrl}:`, err);
        res.status(500).send('Servicio no disponible temporalmente.');
    }
});

// ---------------------------------------------------------
// RUTAS Y ORQUESTACIÓN DE SERVICIOS
// ---------------------------------------------------------

// A. Microservicio de USUARIOS
// Entrada: localhost:3000/registro
// Salida:  http://localhost:3001/api/register
app.post('/registro', createProxyMiddleware({
    ...getProxyOptions(URL_SERVICE_USERS),
    pathRewrite: {
        '^/registro': '/api/register', 
    }
}));

// B. Microservicio de CÓDIGOS
// Entrada: localhost:3000/generar-codigo
// Salida:  http://localhost:3002/api/generate-code
app.post('/generar-codigo', createProxyMiddleware({
    ...getProxyOptions(URL_SERVICE_CODES),
    pathRewrite: {
        '^/generar-codigo': '/api/generate-code',
    }
}));

// C. Microservicio de CONFIRMACIÓN
// Entrada: localhost:3000/confirmar
// Salida:  http://localhost:3003/api/confirm
app.post('/confirmar', createProxyMiddleware({
    ...getProxyOptions(URL_SERVICE_CONFIRM),
    pathRewrite: {
        '^/confirmar': '/api/confirm',
    }
}));

// ---------------------------------------------------------

// Manejo de 404
app.use((req, res) => {
    res.status(404).json({ 
        error: "Endpoint no encontrado.", 
        message: "Verifica la ruta solicitada." 
    });
});

app.listen(PORT, () => {
    console.log(`🔀 API Gateway Distribuido corriendo en puerto ${PORT}`);
    console.table([
        { Ruta_Gateway: '/registro', Destino: URL_SERVICE_USERS },
        { Ruta_Gateway: '/generar-codigo', Destino: URL_SERVICE_CODES },
        { Ruta_Gateway: '/confirmar', Destino: URL_SERVICE_CONFIRM },
    ]);
});
