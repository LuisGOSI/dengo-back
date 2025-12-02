import { supabase } from "../config/supabase.js";

//? GET - Obtener todas las promociones
export const getPromociones = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('promociones')
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener promociones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener una promoción por ID
export const getPromocionById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('promociones')
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Promoción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener promoción:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener promociones activas
export const getPromocionesActivas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('promociones')
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .eq('activa', true)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener promociones activas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener promociones vigentes (activas y dentro del período)
export const getPromocionesVigentes = async (req, res) => {
    try {
        const fechaActual = new Date().toISOString();

        const { data, error } = await supabase
            .from('promociones')
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .eq('activa', true)
            .lte('inicia_en', fechaActual)
            .gte('termina_en', fechaActual)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data,
            total: data.length
        });
    } catch (error) {
        console.error('Error al obtener promociones vigentes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener promociones por tipo
export const getPromocionesByTipo = async (req, res) => {
    try {
        const { tipo } = req.params;

        const { data, error } = await supabase
            .from('promociones')
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .eq('tipo_promocion', tipo)
            .eq('activa', true)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data,
            total: data.length
        });
    } catch (error) {
        console.error('Error al obtener promociones por tipo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? GET - Obtener promociones por nivel de cuenta
export const getPromocionesByNivel = async (req, res) => {
    try {
        const { idNivel } = req.params;

        const { data, error } = await supabase
            .from('promociones')
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .eq('nivel_objetivo_id', idNivel)
            .eq('activa', true)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data,
            total: data.length
        });
    } catch (error) {
        console.error('Error al obtener promociones por nivel:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? POST - Crear una nueva promoción
export const createPromocion = async (req, res) => {
    try {
        const {
            titulo,
            descripcion,
            tipo_promocion,
            porcentaje_descuento,
            monto_descuento,
            inicia_en,
            termina_en,
            nivel_objetivo_id,
            creada_por
        } = req.body;

        // Validar campos obligatorios
        if (!titulo || !descripcion || !tipo_promocion || !inicia_en || !termina_en || !creada_por) {
            return res.status(400).json({
                success: false,
                message: 'Los campos titulo, descripcion, tipo_promocion, inicia_en, termina_en y creada_por son obligatorios'
            });
        }

        // Validar que al menos uno de los descuentos esté presente
        if (!porcentaje_descuento && !monto_descuento) {
            return res.status(400).json({
                success: false,
                message: 'Debe especificar al menos porcentaje_descuento o monto_descuento'
            });
        }

        // Validar fechas
        if (new Date(inicia_en) >= new Date(termina_en)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser anterior a la fecha de término'
            });
        }

        const { data, error } = await supabase
            .from('promociones')
            .insert([
                {
                    titulo,
                    descripcion,
                    tipo_promocion,
                    porcentaje_descuento: porcentaje_descuento || null,
                    monto_descuento: monto_descuento || null,
                    inicia_en,
                    termina_en,
                    nivel_objetivo_id: nivel_objetivo_id || null,
                    creada_por
                }
            ])
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `);

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Promoción creada correctamente',
            data
        });
    } catch (error) {
        console.error('Error al crear promoción:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PUT - Actualizar una promoción
export const updatePromocion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titulo,
            descripcion,
            tipo_promocion,
            porcentaje_descuento,
            monto_descuento,
            inicia_en,
            termina_en,
            nivel_objetivo_id,
            activa
        } = req.body;

        // Verificar si la promoción existe
        const { data: existente, error: errorExistente } = await supabase
            .from('promociones')
            .select('id, activa')
            .eq('id', id)
            .single();

        if (errorExistente) throw errorExistente;

        if (!existente) {
            return res.status(404).json({
                success: false,
                error: 'Promoción no encontrada'
            });
        }

        // Evitar reactivar una promoción deshabilitada
        if (existente.activa === false && activa === true) {
            return res.status(400).json({
                success: false,
                error: 'No se puede volver a habilitar una promoción deshabilitada'
            });
        }

        // Crear objeto dinámico con los campos enviados
        const updateData = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (tipo_promocion !== undefined) updateData.tipo_promocion = tipo_promocion;
        if (porcentaje_descuento !== undefined) updateData.porcentaje_descuento = porcentaje_descuento;
        if (monto_descuento !== undefined) updateData.monto_descuento = monto_descuento;
        if (inicia_en !== undefined) updateData.inicia_en = inicia_en;
        if (termina_en !== undefined) updateData.termina_en = termina_en;
        if (nivel_objetivo_id !== undefined) updateData.nivel_objetivo_id = nivel_objetivo_id;
        if (activa !== undefined) updateData.activa = activa;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se enviaron campos para actualizar'
            });
        }

        // Validar fechas si se envían ambas
        if (updateData.inicia_en && updateData.termina_en) {
            if (new Date(updateData.inicia_en) >= new Date(updateData.termina_en)) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de inicio debe ser anterior a la fecha de término'
                });
            }
        }

        const { data, error } = await supabase
            .from('promociones')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Promoción actualizada correctamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar promoción:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PATCH - Habilitar (reactivar) una promoción deshabilitada
export const enablePromocion = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la promoción existe
        const { data: existente, error: errorExistente } = await supabase
            .from('promociones')
            .select('id, activa')
            .eq('id', id)
            .single();

        if (errorExistente) throw errorExistente;

        if (!existente) {
            return res.status(404).json({
                success: false,
                error: 'Promoción no encontrada'
            });
        }

        // Validar si ya está activa
        if (existente.activa === true) {
            return res.status(400).json({
                success: false,
                error: 'La promoción ya está habilitada'
            });
        }

        // Reactivar la promoción
        const { data, error } = await supabase
            .from('promociones')
            .update({ activa: true })
            .eq('id', id)
            .select(`
                *,
                usuariocr:creada_por (
                    id,
                    nombre,
                    apellidos,
                    email
                ),
                niveles_cuenta:nivel_objetivo_id (
                    id,
                    codigo_nivel,
                    descripcion,
                    visitas_minimas
                )
            `)
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Promoción habilitada correctamente',
            data
        });
    } catch (error) {
        console.error('Error al habilitar promoción:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? DELETE - Eliminación lógica de una promoción
export const deletePromocion = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('promociones')
            .update({ activa: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Promoción no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Promoción eliminada (inactivada) correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar promoción:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};