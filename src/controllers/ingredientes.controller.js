import { supabase } from "../config/supabase.js";

//? GET - Obtener todos los ingredientes
export const getIngredientes = async (req, res) => {
    try{
        const { data, error } = await supabase
            .from('ingredientes')
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
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
                *,
                categorias (
                    id,
                    nombre
                )
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
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `)
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
        const { nombre, descripcion, tipo, id_categoria } = req.body;

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
                    tipo,
                    id_categoria: id_categoria || null
                },
            ])
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `);

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
        const { nombre, descripcion, tipo, activo, id_categoria } = req.body;

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
        if (id_categoria !== undefined) updateData.id_categoria = id_categoria;

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
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `)
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
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `)
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

//? GET - Obtener ingredientes por categoría agrupados por tipo (ACTIVOS)
export const getIngredientesByCategoria = async (req, res) => {
    try {
        const { idCategoria } = req.params;

        // Validar que se proporcione el idCategoria
        if (!idCategoria) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro idCategoria es obligatorio'
            });
        }

        // Obtener ingredientes activos de la categoría específica
        const { data, error } = await supabase
            .from('ingredientes')
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `)
            .eq('id_categoria', idCategoria)
            .eq('activo', true)
            .order('tipo', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) throw error;

        // Agrupar por tipo
        const ingredientesAgrupados = data.reduce((acc, ingrediente) => {
            const tipo = ingrediente.tipo || 'Sin tipo';
            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push(ingrediente);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: `Ingredientes activos de la categoría ${idCategoria} agrupados por tipo`,
            data: ingredientesAgrupados,
            totalIngredientes: data.length,
            totalTipos: Object.keys(ingredientesAgrupados).length
        });
    } catch (error) {
        console.error('Error al obtener ingredientes por categoría:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener ingredientes por ID de producto (a través de la categoría del producto)
export const getIngredientesByProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;

        // Validar que se proporcione el idProducto
        if (!idProducto) {
            return res.status(400).json({
                success: false,
                error: 'El parámetro idProducto es obligatorio'
            });
        }

        // 1. Obtener el producto y su categoría
        const { data: producto, error: errorProducto } = await supabase
            .from('productos')
            .select(`
                id,
                nombre,
                categoria_id,
                categorias (
                    id,
                    nombre
                )
            `)
            .eq('id', idProducto)
            .eq('activo', true)
            .single();

        if (errorProducto) throw errorProducto;

        if (!producto) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado o inactivo'
            });
        }

        // 2. Obtener ingredientes activos de la categoría del producto
        const { data: ingredientes, error: errorIngredientes } = await supabase
            .from('ingredientes')
            .select(`
                *,
                categorias (
                    id,
                    nombre
                )
            `)
            .eq('id_categoria', producto.categoria_id)
            .eq('activo', true)
            .order('tipo', { ascending: true })
            .order('nombre', { ascending: true });

        if (errorIngredientes) throw errorIngredientes;

        // 3. Agrupar por tipo
        const ingredientesAgrupados = ingredientes.reduce((acc, ingrediente) => {
            const tipo = ingrediente.tipo || 'Sin tipo';
            if (!acc[tipo]) {
                acc[tipo] = [];
            }
            acc[tipo].push(ingrediente);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: `Ingredientes activos para el producto ${producto.nombre}`,
            producto: {
                id: producto.id,
                nombre: producto.nombre,
                categoria: producto.categorias
            },
            data: ingredientesAgrupados,
            totalIngredientes: ingredientes.length,
            totalTipos: Object.keys(ingredientesAgrupados).length
        });
    } catch (error) {
        console.error('Error al obtener ingredientes por producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
