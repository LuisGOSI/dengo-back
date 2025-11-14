import { supabase } from "../config/supabase.js";
import QRCode from "qrcode";

// POST - Generar puntos y crear QR temporal
export const generarPuntos = async (req, res) => {
  try {
    const { total } = req.body;

    // Validaciones
    if (total === undefined) {
      return res.status(400).json({
        success: false,
        error: "Falta el total de la venta.",
      });
    }

    // Lógica de puntos
    const puntosGenerados = Math.floor(total / 10);

    // Datos que irán dentro del QR (texto plano legible)
    const qrData = JSON.stringify({
      puntos: puntosGenerados,
      total,
      fecha: new Date().toISOString()
    });

    // Generar el QR en base64 (ya sin doble stringify)
    const qrBase64 = await QRCode.toDataURL(qrData);

    // Responder con el QR y los datos
    res.status(200).json({
      success: true,
      message: "QR generado exitosamente",
      puntos: puntosGenerados,
      qrData,
      qrImage: qrBase64, // imagen en base64
    });
  } catch (error) {
    console.error("Error al generar QR de puntos:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// GET - Ruta de prueba
export const rutaPrueba = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Hola mundo 🌎 desde la API de Dengo"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST - Obtener los puntos del usuario
export const obtenerPuntos = async (req, res) => {
  const { idUsuario } = req.body;
  try {
    const { data, error } = await supabase
      .from('sucursales')
      .select('*')
      .order('creado_en', { ascending: true });



  } catch {

  }
};

// POST - Guardar puntos del QR en el usuario
export const registrarPuntosQR = async (req, res) => {
  try {
    const { idUsuario, puntos } = req.body;

    if (!idUsuario || !puntos) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos (idUsuario o puntos)",
      });
    }

    // 1️⃣ Obtener usuario actual
    const { data: usuarioActual, error: getError } = await supabase
      .from("usuarios")
      .select("puntos, visitas")
      .eq("id", idUsuario)
      .single();

    if (getError || !usuarioActual) throw getError || new Error("Usuario no encontrado");

    // 2️⃣ Calcular nuevos valores
    const nuevosPuntos = (usuarioActual.puntos || 0) + puntos;
    const nuevasVisitas = (usuarioActual.visitas || 0) + 1;

    // 3️⃣ Actualizar usuario
    const { data, error } = await supabase
      .from("usuarios")
      .update({
        puntos: nuevosPuntos,
        visitas: nuevasVisitas
      })
      .eq("id", idUsuario)
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "✅ Puntos registrados correctamente",
      nuevosPuntos,
      nuevasVisitas,
    });

  } catch (error) {
    console.error("Error al registrar puntos:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
