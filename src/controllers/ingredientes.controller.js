import { supabase } from "../config/supabase.js";

//? GET - Obtener todos los ingredientes
export const getIngredientes = async (req, res) => {
    try{
        const { data, error } = await supabase
            .from('ingredientes')
            .select(`
                *
            `)
            .order('creado_en', { ascending: false });
        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener ingredientes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener un ingrediente por ID
export const getIngredienteById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ingredientes')
            .select(`
                *
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Ingrediente no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener ingrediente:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener ingredientes activos
export const getIngredientesActivos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ingredientes')
            .select('*')
            .eq('activo', true)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener ingredientes activos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


//? POST - Crear un nuevo ingrediente
export const createIngrediente = async (req, res) => {
    try {
    const { nombre, descripcion, tipo} = req.body;

    // Validar campos obligatorios
    if (!nombre || !descripcion || !tipo) {
        return res.status(400).json({
        success: false,
        message: 'Los campos nombre, descripcion y tipo son obligatorios',
        });
    }

    const { data, error } = await supabase
        .from('ingredientes')
        .insert([
        {
            nombre,
            descripcion,
            tipo
        },
        ])
        .select();

    if (error) throw error;

    res.status(201).json({
        success: true,
        message: 'Ingrediente creado correctamente',
        data,
    });
    } catch (error) {
    console.error('Error al crear ingrediente:', error);
    res.status(500).json({
        success: false,
        error: error.message,
    });
    }
};

//? PUT - Actualizar un ingrediente
export const updateIngrediente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, tipo, activo } = req.body;

        // Verificar si el ingrediente existe
        const { data: existente, error: errorExistente } = await supabase
            .from('ingredientes')
            .select('id, activo')
            .eq('id', id)
            .single();

        if (errorExistente) throw errorExistente;
        if (!existente) {
            return res.status(404).json({
                success: false,
                error: 'Ingrediente no encontrado'
            });
        }

        // Evitar reactivar un ingrediente deshabilitado
        if (existente.activo === false && activo === true) {
            return res.status(400).json({
                success: false,
                error: 'No se puede volver a habilitar un ingrediente deshabilitado'
            });
        }

        // Crear objeto dinámico con los campos enviados
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (activo !== undefined) updateData.activo = activo;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se enviaron campos para actualizar'
            });
        }

        const { data, error } = await supabase
            .from('ingredientes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Ingrediente actualizado correctamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar ingrediente:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PATCH - Habilitar (reactivar) un ingrediente deshabilitado
export const enableIngrediente = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el ingrediente existe
        const { data: existente, error: errorExistente } = await supabase
            .from('ingredientes')
            .select('id, activo')
            .eq('id', id)
            .single();

        if (errorExistente) throw errorExistente;

        if (!existente) {
            return res.status(404).json({
                success: false,
                error: 'Ingrediente no encontrado'
            });
        }

        // Validar si ya está activo
        if (existente.activo === true) {
            return res.status(400).json({
                success: false,
                error: 'El ingrediente ya está habilitado'
            });
        }

        // Reactivar el ingrediente
        const { data, error } = await supabase
            .from('ingredientes')
            .update({ activo: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Ingrediente habilitado correctamente',
            data
        });
    } catch (error) {
        console.error('Error al habilitar ingrediente:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


//? DELETE - Eliminación lógica de un ingrediente
export const deleteIngrediente = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ingredientes')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Ingrediente no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Ingrediente eliminado (inactivado) correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar ingrediente:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
