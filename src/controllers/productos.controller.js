import { supabase } from "../config/supabase.js";

//? GET - Obtener todos los productos
export const getProductos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias:categoria_id(id, nombre),
                creador:creado_por(id, nombre, email)
            `)
            .eq('activo', true)
            .eq('eliminado', false)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener un producto por ID
export const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias:categoria_id(id, nombre),
                creador:creado_por(id, nombre, email)
            `)
            .eq('id', id)
            .eq('eliminado', false)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener productos activos (para menu público)
export const getProductosActivos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias:categoria_id(id, nombre)
            `)
            .eq('activo', true)
            .eq('eliminado', false)
            .or('deshabilitado_hasta.is.null,deshabilitado_hasta.lt.now()')
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener productos activos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener productos por categoría
export const getProductosByCategoria = async (req, res) => {
    try {
        const { categoriaId } = req.params;

        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias:categoria_id(id, nombre)
            `)
            .eq('categoria_id', categoriaId)
            .eq('activo', true)
            .eq('eliminado', false)
            .order('nombre', { ascending: true });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener productos por categoría:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? POST - Crear un nuevo producto
export const createProducto = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            precio,
            url_imagen,
            categoria_id,
            creado_por
        } = req.body;

        // Validaciones básicas
        if (!nombre || !precio) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y precio son requeridos'
            });
        }

        const { data, error } = await supabase
            .from('productos')
            .insert([{
                nombre,
                descripcion,
                precio,
                url_imagen,
                categoria_id,
                creado_por
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PUT - Actualizar un producto
export const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            precio,
            url_imagen,
            categoria_id,
            activo
        } = req.body;

        const updateData = {
            ...(nombre && { nombre }),
            ...(descripcion !== undefined && { descripcion }),
            ...(precio && { precio }),
            ...(url_imagen !== undefined && { url_imagen }),
            ...(categoria_id && { categoria_id }),
            ...(activo !== undefined && { activo }),
            actualizado_en: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('productos')
            .update(updateData)
            .eq('id', id)
            .eq('eliminado', false)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PATCH - Deshabilitar temporalmente un producto
export const deshabilitarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { razon, hasta } = req.body;

        const { data, error } = await supabase
            .from('productos')
            .update({
                activo: false,
                razon_deshabilitacion_temporal: razon,
                deshabilitado_hasta: hasta,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id)
            .eq('eliminado', false)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto deshabilitado temporalmente',
            data
        });
    } catch (error) {
        console.error('Error al deshabilitar producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PATCH - Habilitar producto
export const habilitarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('productos')
            .update({
                activo: true,
                razon_deshabilitacion_temporal: null,
                deshabilitado_hasta: null,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id)
            .eq('eliminado', false)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto habilitado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al habilitar producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? DELETE - Eliminación lógica (soft delete)
export const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('productos')
            .update({
                eliminado: true,
                activo: false,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? POST - Asignar producto favorito a un usuario
export const addProductoFavorito = async (req, res) => {
    try {
        const { usuario_id, producto_id, receta_id } = req.body;

        // Validar los campos obligatorios
        if (!usuario_id || !producto_id) {
            return res.status(400).json({
                success: false,
                error: 'el usario y producto son requeridos'
            });
        }

        const nuevoFavorito = {
            usuario_id,
            producto_id,
            receta_id: receta_id || null // si no viene, queda NULL
        };

        const { data, error } = await supabase
            .from('favoritos_usuario')
            .insert([nuevoFavorito])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Favorito asignado correctamente',
            data
        });
    } catch (error) {
        console.error('Error al asignar favorito:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener los productos favoritos de un usuario
export const getFavoritosByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;

        // Selecciona favoritos con datos de producto y receta (si existe)
        const { data, error } = await supabase
            .from('favoritos_usuario')
            .select(`
                id,
                producto_id,
                receta_id,
                productos:producto_id (
                    id,
                    nombre,
                    precio,
                    url_imagen
                ),
                receta:receta_id (
                    id,
                    nombre,
                    descripcion,
                    imagen
                )
            `)
            .eq('usuario_id', usuario_id);

        if (error) throw error;

        // Si receta_id es null, la respuesta devuelve "receta": null.
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? POST - Eliminar un favorito de un usuario
export const deleteFavoritoById = async (req, res) => {
    try {
        const { id } = req.body;
        const { data, error } = await supabase
            .from('favoritos_usuario')
            .delete()
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Favorito no encontrado'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Favorito eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar favorito:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

