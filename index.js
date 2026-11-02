const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión oficial a Supabase usando las variables de entorno
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Ruta de prueba inicial (Método GET)
app.get('/', (req, res) => {
    res.json({ mensaje: '¡El backend de la app de conductores está activo y conectado!' });
});

// 1. Ruta para verificar suscripción
app.post('/api/verificar-suscripcion', async (req, res) => {
    const { telefono } = req.body;
    
    if (!telefono) {
        return res.status(400).json({ error: 'Se requiere el número de teléfono' });
    }

    try {
        const telefonoLimpio = telefono.trim();
        
        // Consultamos en Supabase
        const { data, error } = await supabase
            .from('conductores')
            .select('*')
            .eq('telefono', telefonoLimpio)
            .maybeSingle();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // 🛑 VALIDACIÓN CLAVE: Si el número no existe en la base de datos
        if (!data) {
            return res.status(404).json({ 
                exito: false, 
                mensaje: 'El número no está registrado en la base de datos.' 
            });
        }

        // Si el número SÍ existe
        return res.json({ 
            exito: true, 
            mensaje: '¡Prueba gratuita o suscripción vigente!', 
            data 
        });

    } catch (err) {
        console.error("Error en el servidor:", err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 2. Ruta para registrar (Ejemplo de registro por 7 días)
app.post('/api/registrar', async (req, res) => {
    const { telefono } = req.body;

    if (!telefono) {
        return res.status(400).json({ error: 'Se requiere el número de teléfono' });
    }

    try {
        const telefonoLimpio = telefono.trim();

        // Verificar si ya existe para evitar duplicados
        const { data: existente, error: errBusqueda } = await supabase
            .from('conductores')
            .select('*')
            .eq('telefono', telefonoLimpio)
            .maybeSingle();

        if (errBusqueda) {
            return res.status(500).json({ error: errBusqueda.message });
        }

        if (existente) {
            return res.status(400).json({ 
                exito: false, 
                mensaje: 'El número ya se encuentra registrado.' 
            });
        }

        // Fecha de vencimiento a 7 días a partir de hoy
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);

        // Insertar nuevo conductor
        const { data, error: errInsert } = await supabase
            .from('conductores')
            .insert([
                { telefono: telefonoLimpio, fecha_vencimiento: fechaVencimiento }
            ])
            .select()
            .single();

        if (errInsert) {
            return res.status(500).json({ error: errInsert.message });
        }

        return res.json({ 
            exito: true, 
            mensaje: 'Registro de 7 días realizado con éxito.',
            data 
        });

    } catch (err) {
        console.error("Error en el servidor:", err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Configuración del puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});