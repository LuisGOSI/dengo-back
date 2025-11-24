import { supabase } from "../config/supabase.js";

//? GET - Obtener todos los eventos activos con sucursal activa
export const getEventos = async (req, res) => {
  try {
    // Traer todos los eventos activos con su sucursal
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        sucursales:sucursal_id(id, nombre, direccion, activa)
      `)
      .eq('activo', true)
      .order('inicia_en', { ascending: true });

    if (error) throw error;

    // Filtro para conservar solo los que tienen sucursal activa
    const eventosFiltrados = data.filter(
      (evento) => evento.sucursales && evento.sucursales.activa === true
    );

    res.status(200).json({
      success: true,
      data: eventosFiltrados
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

//? GET - Obtener un evento por ID (solo si sucursal y evento están activos)
export const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        sucursales:sucursal_id(id, nombre, direccion, activa)
      `)
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (error) throw error;

    // Si no existe o la sucursal está inactiva, no devolver nada
    if (!data || !data.sucursales || data.sucursales.activa !== true) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado o su sucursal está inactiva'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


//? POST - Crear un nuevo evento
export const createEvento = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      sucursal_id,
      inicia_en,
      termina_en,
      capacidad, 
      img
    } = req.body;

    // Validación básica
    if (!titulo || !sucursal_id) {
      return res.status(400).json({
        success: false,
        error: 'El título y la sucursal son obligatorios'
      });
    }

    const { data, error } = await supabase
      .from('eventos')
      .insert([{
        titulo,
        descripcion,
        sucursal_id,
        inicia_en,
        termina_en,
        capacidad,
        img
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

//? PUT - Actualizar evento
export const updateEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      sucursal_id,
      inicia_en,
      termina_en,
      capacidad, 
      img
    } = req.body;

    const updateData = {};

    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (sucursal_id !== undefined) updateData.sucursal_id = sucursal_id;
    if (inicia_en !== undefined) updateData.inicia_en = inicia_en;
    if (termina_en !== undefined) updateData.termina_en = termina_en;
    if (capacidad !== undefined) updateData.capacidad = capacidad;
    if (img !== undefined) updateData.img = img;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se enviaron campos para actualizar'
      });
    }

    const { data, error } = await supabase
      .from('eventos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

//? DELETE - Eliminación lógica (activo = false)
export const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('eventos')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evento eliminado (inactivado) exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

//? GET - Obtener todos los eventos activos de una sucursal (no importa el estatus de la sucursal)
export const getEventosBySucursal = async (req, res) => {
  try {
    const { sucursal_id } = req.params;

    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *
      `)
      .eq('sucursal_id', sucursal_id)
      .eq('activo', true)
      .order('inicia_en', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron eventos activos para esta sucursal'
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error al obtener eventos por sucursal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

