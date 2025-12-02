import { supabase } from "../config/supabase.js";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

const pedidosController = {
    // Crear un nuevo pedido
    crearPedido: async (req, res) => {
        try {
            const {
                usuario_id,
                sucursal_id,
                metodo_entrega = 'en_local',
                notas,
                datos_personalizados,
                items,
                pagos
            } = req.body;

            // Validaciones básicas
            if (!sucursal_id) {
                return res.status(400).json({ error: 'La sucursal es requerida' });
            }

            if (!items || items.length === 0) {
                return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
            }

            // Generar número de pedido único
            const numeroPedido = `PED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Calcular subtotal
            let subtotal = 0;
            const itemsConPrecio = await Promise.all(
                items.map(async (item) => {
                    let precioUnitario = item.precio_unitario;

                    // Si no viene precio, buscar en producto 
                    if (!precioUnitario) {
                        if (item.producto_id) {
                            const { data: producto } = await supabase
                                .from('productos')
                                .select('precio, nombre')
                                .eq('id', item.producto_id)
                                .single();
                            precioUnitario = producto?.precio || 0;
                            nombre_item = producto?.nombre || "Producto"
                        }
                    }

                    if (!nombre_item && item.producto_id) {
                        const { data: producto } = await supabase
                            .from('productos')
                            .select('nombre')
                            .eq('id', item.producto_id)
                            .single();
                        item.nombre_item = producto?.nombre || 'Producto';
                    }

                    const totalItem = precioUnitario * item.cantidad;
                    subtotal += totalItem;

                    return {
                        ...item,
                        precio_unitario: precioUnitario,
                        nombre_item: item.nombre_item || 'Producto'
                    };
                })
            );

            // Calcular total 
            const total = subtotal;

            // Crear el pedido
            const { data: pedido, error: errorPedido } = await supabase
                .from('pedidos')
                .insert([
                    {
                        usuario_id,
                        sucursal_id,
                        numero_pedido: numeroPedido,
                        metodo_entrega,
                        notas,
                        datos_personalizados,
                        subtotal,
                        total,
                        estado: 'recibido'
                    }
                ])
                .select()
                .single();

            if (errorPedido) {
                console.error('Error creando pedido:', errorPedido);
                return res.status(500).json({ error: 'Error al crear el pedido' });
            }

            // Crear items del pedido
            const itemsConPedidoId = itemsConPrecio.map(item => ({
                ...item,
                pedido_id: pedido.id
            }));

            const { error: errorItems } = await supabase
                .from('items_pedido')
                .insert(itemsConPedidoId);

            if (errorItems) {
                console.error('Error creando items:', errorItems);
                return res.status(500).json({ error: 'Error al crear los items del pedido' });
            }

            // Crear pagos si existen
            if (pagos && pagos.length > 0) {
                const pagosConPedidoId = pagos.map(pago => ({
                    ...pago,
                    pedido_id: pedido.id
                }));

                const { error: errorPagos } = await supabase
                    .from('pagos')
                    .insert(pagosConPedidoId);

                if (errorPagos) {
                    console.error('Error creando pagos:', errorPagos);
                }
            }

            // Obtener el pedido completo con relaciones
            const { data: pedidoCompleto } = await supabase
                .from('pedidos')
                .select(`
          *,
          items_pedido (*),
          pagos (*),
          usuarios (id, nombre, apellidos, email),
          sucursales (id, nombre, direccion)
        `)
                .eq('id', pedido.id)
                .single();

            res.status(201).json({
                mensaje: 'Pedido creado exitosamente',
                pedido: pedidoCompleto
            });

        } catch (error) {
            console.error('Error en crearPedido:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener todos los pedidos (con filtros opcionales)
    obtenerPedidos: async (req, res) => {
        try {
            const {
                usuario_id,
                sucursal_id,
                estado,
                fecha_inicio,
                fecha_fin,
                pagina = 1,
                por_pagina = 10
            } = req.query;

            let query = supabase
                .from('pedidos')
                .select(`
          *,
          usuarios (id, nombre, apellidos, email),
          sucursales (id, nombre, direccion),
          items_pedido (*),
          pagos (*)
        `, { count: 'exact' });

            // Aplicar filtros
            if (usuario_id) {
                query = query.eq('usuario_id', usuario_id);
            }

            if (sucursal_id) {
                query = query.eq('sucursal_id', sucursal_id);
            }

            if (estado) {
                query = query.eq('estado', estado);
            }

            if (fecha_inicio) {
                query = query.gte('creado_en', fecha_inicio);
            }

            if (fecha_fin) {
                query = query.lte('creado_en', fecha_fin);
            }

            // Paginación
            const desde = (pagina - 1) * por_pagina;
            const hasta = desde + por_pagina - 1;

            query = query
                .order('creado_en', { ascending: false })
                .range(desde, hasta);

            const { data: pedidos, error, count } = await query;

            if (error) {
                console.error('Error obteniendo pedidos:', error);
                return res.status(500).json({ error: 'Error al obtener los pedidos' });
            }

            res.json({
                pedidos,
                paginacion: {
                    pagina: parseInt(pagina),
                    por_pagina: parseInt(por_pagina),
                    total: count
                }
            });

        } catch (error) {
            console.error('Error en obtenerPedidos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener un pedido por ID
    obtenerPedidoPorId: async (req, res) => {
        try {
            const { id } = req.params;

            const { data: pedido, error } = await supabase
                .from('pedidos')
                .select(`
          *,
          usuarios (id, nombre, apellidos, email, telefono),
          sucursales (id, nombre, direccion, telefono),
          items_pedido (
            *,
            producto:productos (id, nombre, precio, url_imagen),
            receta:recetas_comunidad (id, nombre, descripcion, imagen)
          ),
          pagos (*),
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error obteniendo pedido:', error);
                return res.status(500).json({ error: 'Error al obtener el pedido' });
            }

            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            res.json(pedido);

        } catch (error) {
            console.error('Error en obtenerPedidoPorId:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Actualizar estado de un pedido
    actualizarEstadoPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!estado) {
                return res.status(400).json({ error: 'El estado es requerido' });
            }

            const estadosPermitidos = ['recibido', 'preparando', 'listo', 'entregado', 'cancelado'];
            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({ error: 'Estado no válido' });
            }

            const updates = {
                estado,
                actualizado_en: new Date().toISOString()
            };

            const { data: pedido, error } = await supabase
                .from('pedidos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error actualizando pedido:', error);
                return res.status(500).json({ error: 'Error al actualizar el pedido' });
            }

            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            try {
                // A. Buscamos el token del usuario dueño del pedido
                const userId = pedido.usuario_id;

                if (userId) {
                    const { data: usuarioData, error: userError } = await supabase
                        .from('usuarios')
                        .select('expo_push_token')
                        .eq('id', userId)
                        .single();

                    // B. Si encontramos usuario y tiene token, enviamos la notificación
                    if (!userError && usuarioData?.expo_push_token) {

                        if (Expo.isExpoPushToken(usuarioData.expo_push_token)) {

                            // Mensajes personalizados según el estado (Opcional)
                            let titulo = 'Actualización de pedido! ';
                            let cuerpo = `Tu pedido ahora está: ${estado}`;

                            if (estado === 'preparando') {
                                titulo = '¡Tu pedido está en preparación!';
                                cuerpo = 'Estamos preparando tu pedido.';
                            } else if (estado === 'listo') {
                                titulo = '¡Tu pedido está listo!';
                                cuerpo = 'Ya puedes pasar a recogerlo.';
                            } else if (estado === 'cancelado') {
                                titulo = 'Hemos cancelado tu pedido';
                            }

                            await expo.sendPushNotificationsAsync([{
                                to: usuarioData.expo_push_token,
                                sound: 'default',
                                title: titulo,
                                body: cuerpo,
                                data: { pedidoId: id, pantalla: 'DetallePedido' }, // Datos extra para navegar al dar click
                            }]);

                            console.log(`Notificación enviada al usuario ${userId}`);
                        }
                    }
                }
            } catch (notifError) {
                // Importante: No detenemos la respuesta si falla la notificación, solo lo logueamos
                console.error('Error enviando notificación (el pedido sí se actualizó):', notifError);
            }

            res.json({
                mensaje: 'Estado del pedido actualizado exitosamente',
                pedido
            });

        } catch (error) {
            console.error('Error en actualizarEstadoPedido:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener pedidos por usuario (sin paginación, devuelve todos)
    obtenerPedidosPorUsuario: async (req, res) => {
        try {
            const { usuario_id } = req.params;
            const { estado } = req.query;

            let query = supabase
                .from('pedidos')
                .select(`
          *,
          sucursales (id, nombre, direccion),
          items_pedido (*),
          pagos (*)
        `)
                .eq('usuario_id', usuario_id)
                .order('creado_en', { ascending: false });

            if (estado) {
                query = query.eq('estado', estado);
            }

            const { data: pedidos, error } = await query;

            if (error) {
                console.error('Error obteniendo pedidos del usuario:', error);
                return res.status(500).json({ error: 'Error al obtener los pedidos' });
            }

            res.json({ pedidos });

        } catch (error) {
            console.error('Error en obtenerPedidosPorUsuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Cancelar pedido
    cancelarPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const { razon } = req.body;

            // Verificar que el pedido existe y puede ser cancelado
            const { data: pedidoExistente } = await supabase
                .from('pedidos')
                .select('estado')
                .eq('id', id)
                .single();

            if (!pedidoExistente) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            if (['entregado', 'cancelado'].includes(pedidoExistente.estado)) {
                return res.status(400).json({ error: 'No se puede cancelar un pedido en este estado' });
            }

            const updates = {
                estado: 'cancelado',
                notas: razon ? `Cancelado: ${razon}` : 'Pedido cancelado',
                actualizado_en: new Date().toISOString()
            };

            const { data: pedido, error } = await supabase
                .from('pedidos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error cancelando pedido:', error);
                return res.status(500).json({ error: 'Error al cancelar el pedido' });
            }

            res.json({
                mensaje: 'Pedido cancelado exitosamente',
                pedido
            });

        } catch (error) {
            console.error('Error en cancelarPedido:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

export default pedidosController;