import { supabase } from '../config/supabase.js'; 

// GET: Obtener feed de la comunidad (solo aprobados o públicos)
export const getCommunityFeed = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('recetas_comunidad')
            .select('*, usuarios(nombre)') // Traemos el nombre del creador
            .eq('estado', 'aprobado') // Asumimos que solo mostramos los aprobados por defecto
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getCommunityRecipeById = async (req, res) => {
    const { recipe_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('recetas_comunidad')
            .select('*, usuarios(nombre)')
            .eq('id', recipe_id)
            .eq('estado', 'aprobado') // Solo recetas aprobadas
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// GET: Obtener mis creaciones
export const getMyCreations = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const { data, error } = await supabase
            .from('recetas_comunidad')
            .select('*')
            .eq('usuario_id', usuario_id)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST: Crear nueva receta
export const createCreation = async (req, res) => {

    try {

        const {
            nombre,
            descripcion,    
            usuario_id,
            tamano,
            imagen,
            categoria_id,
        } = req.body;

        if (!usuario_id || !nombre || !descripcion || !tamano || !categoria_id) {
            return res.status(400).json({ success: false, error: 'Faltan datos' });
        }

        const precio = tamano === 'pequeño' ? 30 : tamano === 'mediano' ? 40 : 50;

        const { data: productData, error: productError } = await supabase
            .from('productos')
            .insert([{
                nombre,
                descripcion,
                precio,
                url_imagen: imagen,
                categoria_id,
                creado_por: usuario_id,
                tipo_pro: 'comunidad',
                activo: false
            }])
            .select()
            .single();
        
        if (productError) throw productError;

        const { data, error } = await supabase
            .from('recetas_comunidad')
            .insert([{
                id: productData.id, // Usamos el mismo ID que el producto creado
                usuario_id,
                nombre,
                descripcion,
                imagen, // URL de la imagen o base seleccionada
                estado: 'pendiente', // Para pruebas lo dejamos aprobado directo, luego puedes poner 'pendiente'
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// DELETE: Borrar receta
export const deleteCreation = async (req, res) => {
    const { id } = req.body; // Esperamos { id: 123 } en el body
    try {
        const { error } = await supabase
            .from('recetas_comunidad')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const aprobarCreation = async (req, res) => {
    const { id } = req.body; // Esperamos { id: 123 } en el body
    try {
        const { data, error } = await supabase
            .from('recetas_comunidad')
            .update({ estado: 'aprobado' })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const rechazarCreation = async (req, res) => {
    const { id } = req.body; // Esperamos { id: 123 } en el body
    try {
        const { data, error } = await supabase
            .from('recetas_comunidad')
            .update({ estado: 'rechazado' })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPendingCreations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('recetas_comunidad')
            .select('*, usuarios(nombre)')
            .eq('estado', 'pendiente')
            .order('creado_en', { ascending: false });
        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};