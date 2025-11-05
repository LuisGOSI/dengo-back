import { supabase } from "../config/supabase.js";

//? GET - Obtener todas las sucursales
export const getSucursales = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .order('creado_en', { ascending: true });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener sucursales:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener una sucursal por ID
export const getSucursalById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Sucursal no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener sucursal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? POST - Crear una nueva sucursal
export const createSucursal = async (req, res) => {
    try {
        const {
            nombre,
            direccion,
            latitud,
            longitud,
            telefono,
            horario_apertura
        } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                error: 'El nombre de la sucursal es requerido'
            });
        }

        const { data, error } = await supabase
            .from('sucursales')
            .insert([{
                nombre,
                direccion,
                latitud,
                longitud,
                telefono,
                horario_apertura
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Sucursal creada exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al crear sucursal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PUT - Actualizar datos de una sucursal (excepto el estatus)
export const updateSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            direccion,
            latitud,
            longitud,
            telefono,
            horario_apertura
        } = req.body;

        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (direccion !== undefined) updateData.direccion = direccion;
        if (latitud !== undefined) updateData.latitud = latitud;
        if (longitud !== undefined) updateData.longitud = longitud;
        if (telefono !== undefined) updateData.telefono = telefono;
        if (horario_apertura !== undefined) updateData.horario_apertura = horario_apertura;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se enviaron campos para actualizar'
            });
        }

        const { data, error } = await supabase
            .from('sucursales')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Sucursal no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Sucursal actualizada exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar sucursal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PATCH - Activar / desactivar sucursal
export const toggleSucursalActiva = async (req, res) => {
    try {
        const { id } = req.params;
        const { activa } = req.body; // true o false

        if (activa === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Se necesita un valor adecuado para la petición'
            });
        }

        const { data, error } = await supabase
            .from('sucursales')
            .update({ activa })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Sucursal no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: activa
                ? 'Sucursal activada correctamente'
                : 'Sucursal desactivada correctamente',
            data
        });
    } catch (error) {
        console.error('Error al cambiar estatus de sucursal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


