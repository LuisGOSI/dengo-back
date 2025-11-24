import { supabase } from "../config/supabase.js";

const ventasController = {
    // Registrar una nueva venta (desde un pedido completado)
    registrarVenta: async (req, res) => {
        try {
            const {
                pedido_id,
                sucursal_id,
                usuario_id = null, // Puede ser null para clientes no registrados
                items,
                metodo_pago = 'tarjeta', // Por defecto 'tarjeta'
                monto_pagado,
                puntos_usados = 0,
                descuento_aplicado = 0,
                notas,
                referencia_transaccion
            } = req.body;

            // Generar referencia si no viene
            let referenciaTransaccion = referencia_transaccion;
            if (!referenciaTransaccion) {
                referenciaTransaccion = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            // Validaciones básicas
            if (!sucursal_id) {
                return res.status(400).json({ error: 'La sucursal es requerida' });
            }

            if (!items || items.length === 0) {
                return res.status(400).json({ error: 'La venta debe tener al menos un item' });
            }

            // Si se intentan usar puntos, debe haber un usuario
            if (puntos_usados > 0 && !usuario_id) {
                return res.status(400).json({
                    error: 'Se requiere un usuario registrado para usar puntos'
                });
            }

            // Calcular subtotal de items
            let subtotal = 0;
            const itemsConPrecio = await Promise.all(
                items.map(async (item) => {
                    let precioUnitario = item.precio_unitario;
                    let nombre_item = item.nombre_item;

                    // Si no viene precio, buscar en producto
                    if (!precioUnitario && item.producto_id) {
                        const { data: producto } = await supabase
                            .from('productos')
                            .select('precio, nombre')
                            .eq('id', item.producto_id)
                            .single();
                        precioUnitario = producto?.precio || 0;
                        nombre_item = producto?.nombre || "Producto";
                    }

                    // Si no viene nombre, buscar en producto
                    if (!nombre_item && item.producto_id) {
                        const { data: producto } = await supabase
                            .from('productos')
                            .select('nombre')
                            .eq('id', item.producto_id)
                            .single();
                        nombre_item = producto?.nombre || 'Producto';
                    }

                    const totalItem = precioUnitario * item.cantidad;
                    subtotal += totalItem;

                    return {
                        ...item,
                        precio_unitario: precioUnitario,
                        nombre_item: nombre_item || 'Producto',
                    };
                })
            );

            // Calcular descuento por puntos (1 punto = 1 peso)
            const descuentoPorPuntos = puntos_usados;
            const descuentoTotal = descuento_aplicado + descuentoPorPuntos;

            // Calcular total
            const total = Math.max(0, subtotal - descuentoTotal);

            // Si se usan puntos, verificar que el usuario tenga suficientes
            if (puntos_usados > 0 && usuario_id) {
                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('puntos')
                    .eq('id', usuario_id)
                    .single();

                if (!usuario || usuario.puntos < puntos_usados) {
                    return res.status(400).json({
                        error: 'El usuario no tiene suficientes puntos',
                        puntos_disponibles: usuario?.puntos || 0,
                        puntos_requeridos: puntos_usados
                    });
                }

                // Descontar los puntos usados
                await supabase
                    .from('usuarios')
                    .update({
                        puntos: usuario.puntos - puntos_usados
                    })
                    .eq('id', usuario_id);
            }

            // Crear el pedido si no existe
            let pedidoId = pedido_id;
            let pedidoData = null;

            if (!pedido_id) {
                const numeroPedido = `VTA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                const { data: nuevoPedido, error: errorPedido } = await supabase
                    .from('pedidos')
                    .insert([{
                        usuario_id, // Puede ser null
                        sucursal_id,
                        numero_pedido: numeroPedido,
                        metodo_entrega: 'en_local',
                        notas,
                        subtotal,
                        descuentos: descuentoTotal,
                        total,
                        estado: 'entregado'
                    }])
                    .select()
                    .single();

                if (errorPedido) {
                    console.error('Error creando pedido:', errorPedido);
                    return res.status(500).json({ error: 'Error al crear el pedido' });
                }

                pedidoId = nuevoPedido.id;
                pedidoData = nuevoPedido;

                // Crear items del pedido
                const itemsConPedidoId = itemsConPrecio.map(item => ({
                    ...item,
                    pedido_id: pedidoId
                }));

                const { error: errorItems } = await supabase
                    .from('items_pedido')
                    .insert(itemsConPedidoId);

                if (errorItems) {
                    console.error('Error creando items:', errorItems);
                    return res.status(500).json({ error: 'Error al crear los items del pedido' });
                }
            } else {
                // Actualizar pedido existente a entregado
                const { data: pedidoActualizado, error: errorUpdate } = await supabase
                    .from('pedidos')
                    .update({
                        estado: 'entregado',
                        descuentos: descuentoTotal,
                        total,
                        actualizado_en: new Date().toISOString()
                    })
                    .eq('id', pedido_id)
                    .select()
                    .single();

                if (errorUpdate) {
                    console.error('Error actualizando pedido:', errorUpdate);
                    return res.status(500).json({ error: 'Error al actualizar el pedido' });
                }

                pedidoData = pedidoActualizado;
            }

            // Registrar el pago
            const { data: pago, error: errorPago } = await supabase
                .from('pagos')
                .insert([{
                    pedido_id: pedidoId,
                    pagado_por_usuario_id: usuario_id, // Puede ser null
                    metodo: metodo_pago,
                    monto: monto_pagado || total,
                    cambio: (monto_pagado || total) - total,
                    referencia_transaccion: referenciaTransaccion
                }])
                .select()
                .single();

            if (errorPago) {
                console.error('Error registrando pago:', errorPago);
                return res.status(500).json({ error: 'Error al registrar el pago' });
            }

            // Actualizar visitas si hay usuario
            if (usuario_id) {
                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('visitas, nivel_id')
                    .eq('id', usuario_id)
                    .single();

                if (usuario) {
                    const nuevasVisitas = usuario.visitas + 1;

                    await supabase
                        .from('usuarios')
                        .update({
                            visitas: nuevasVisitas
                        })
                        .eq('id', usuario_id);

                    // Verificar si debe subir de nivel
                    const { data: nivelActual } = await supabase
                        .from('niveles_cuenta')
                        .select('visitas_minimas')
                        .eq('id', usuario.nivel_id)
                        .single();

                    const { data: siguienteNivel } = await supabase
                        .from('niveles_cuenta')
                        .select('id, visitas_minimas')
                        .gt('visitas_minimas', nivelActual?.visitas_minimas || 0)
                        .lte('visitas_minimas', nuevasVisitas)
                        .order('visitas_minimas', { ascending: false })
                        .limit(1)
                        .single();

                    if (siguienteNivel) {
                        await supabase
                            .from('usuarios')
                            .update({ nivel_id: siguienteNivel.id })
                            .eq('id', usuario_id);
                    }
                }
            }

            // Obtener la venta completa con relaciones
            const { data: ventaCompleta } = await supabase
                .from('pedidos')
                .select(`
                    numero_pedido, metodo_entrega, estado, subtotal, descuentos, total, creado_en,
                    items_pedido (
                        *,
                        productos (id, nombre, precio)
                    ),
                    pagos (*),
                    usuarios (id, nombre, apellidos, email, puntos, visitas),
                    sucursales (nombre)
                `)
                .eq('id', pedidoId)
                .single();

            res.status(201).json({
                mensaje: 'Venta registrada exitosamente',
                venta: ventaCompleta,
                puntos_usados: puntos_usados,
                //  El frontend debe llamar a /api/puntos con el total
                // instrucciones_qr: {
                //     mensaje: 'Llamar a POST /api/puntos con el total de la venta',
                //     endpoint: '/api/puntos/generar',
                //     body: { total: total }
                // }
            });

        } catch (error) {
            console.error('Error en registrarVenta:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener todas las ventas (con filtros)
    obtenerVentas: async (req, res) => {
        try {
            const {
                sucursal_id,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                metodo_pago,
                pagina = 1,
                por_pagina = 10
            } = req.query;

            let query = supabase
                .from('pedidos')
                .select(`
                    *,
                    items_pedido (
                        *,
                        productos (id, nombre, precio)
                    ),
                    pagos (*),
                    usuarios (id, nombre, apellidos, email),
                    sucursales (id, nombre)
                `, { count: 'exact' })
                .eq('estado', 'entregado');

            // Aplicar filtros
            if (sucursal_id) {
                query = query.eq('sucursal_id', sucursal_id);
            }

            if (usuario_id) {
                query = query.eq('usuario_id', usuario_id);
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

            const { data: ventas, error, count } = await query;

            if (error) {
                console.error('Error obteniendo ventas:', error);
                return res.status(500).json({ error: 'Error al obtener las ventas' });
            }

            // Filtrar por método de pago si se especifica
            let ventasFiltradas = ventas;
            if (metodo_pago) {
                ventasFiltradas = ventas.filter(venta =>
                    venta.pagos.some(pago => pago.metodo === metodo_pago)
                );
            }

            res.json({
                ventas: ventasFiltradas,
                paginacion: {
                    pagina: parseInt(pagina),
                    por_pagina: parseInt(por_pagina),
                    total: metodo_pago ? ventasFiltradas.length : count
                }
            });

        } catch (error) {
            console.error('Error en obtenerVentas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener resumen de ventas
    obtenerResumenVentas: async (req, res) => {
        try {
            const {
                sucursal_id,
                fecha_inicio,
                fecha_fin
            } = req.query;

            let query = supabase
                .from('pedidos')
                .select('total, creado_en, pagos(*)')
                .eq('estado', 'entregado');

            if (sucursal_id) {
                query = query.eq('sucursal_id', sucursal_id);
            }

            if (fecha_inicio) {
                query = query.gte('creado_en', fecha_inicio);
            }

            if (fecha_fin) {
                query = query.lte('creado_en', fecha_fin);
            }

            const { data: ventas, error } = await query;

            if (error) {
                console.error('Error obteniendo resumen:', error);
                return res.status(500).json({ error: 'Error al obtener el resumen' });
            }

            // Calcular estadísticas
            const totalVentas = ventas.length;
            const ingresoTotal = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
            const promedioVenta = totalVentas > 0 ? ingresoTotal / totalVentas : 0;

            // Agrupar por método de pago
            const ventasPorMetodo = {};
            ventas.forEach(venta => {
                venta.pagos.forEach(pago => {
                    if (!ventasPorMetodo[pago.metodo]) {
                        ventasPorMetodo[pago.metodo] = {
                            cantidad: 0,
                            monto_total: 0
                        };
                    }
                    ventasPorMetodo[pago.metodo].cantidad += 1;
                    ventasPorMetodo[pago.metodo].monto_total += parseFloat(pago.monto || 0);
                });
            });

            res.json({
                resumen: {
                    total_ventas: totalVentas,
                    ingreso_total: parseFloat(ingresoTotal.toFixed(2)),
                    promedio_venta: parseFloat(promedioVenta.toFixed(2)),
                    ventas_por_metodo: ventasPorMetodo
                },
                periodo: {
                    inicio: fecha_inicio || 'Inicio',
                    fin: fecha_fin || 'Ahora'
                }
            });

        } catch (error) {
            console.error('Error en obtenerResumenVentas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener productos más vendidos
    obtenerProductosMasVendidos: async (req, res) => {
        try {
            const {
                sucursal_id,
                fecha_inicio,
                fecha_fin,
                limite = 10
            } = req.query;

            let query = supabase
                .from('pedidos')
                .select(`
                    items_pedido (
                        producto_id,
                        cantidad,
                        productos (id, nombre, precio)
                    ),
                    creado_en
                `)
                .eq('estado', 'entregado');

            if (sucursal_id) {
                query = query.eq('sucursal_id', sucursal_id);
            }

            if (fecha_inicio) {
                query = query.gte('creado_en', fecha_inicio);
            }

            if (fecha_fin) {
                query = query.lte('creado_en', fecha_fin);
            }

            const { data: pedidos, error } = await query;

            if (error) {
                console.error('Error obteniendo productos:', error);
                return res.status(500).json({ error: 'Error al obtener productos más vendidos' });
            }

            // Agrupar y contar productos
            const productosMap = new Map();

            pedidos.forEach(pedido => {
                pedido.items_pedido.forEach(item => {
                    if (item.producto_id && item.productos) {
                        const key = item.producto_id;
                        if (!productosMap.has(key)) {
                            productosMap.set(key, {
                                ...item.productos,
                                cantidad_vendida: 0,
                                ingresos_generados: 0
                            });
                        }
                        const producto = productosMap.get(key);
                        producto.cantidad_vendida += item.cantidad;
                        producto.ingresos_generados += item.cantidad * parseFloat(item.productos.precio || 0);
                    }
                });
            });

            // Convertir a array y ordenar
            const productosArray = Array.from(productosMap.values())
                .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
                .slice(0, parseInt(limite));

            res.json({
                productos_mas_vendidos: productosArray,
                total_productos: productosArray.length
            });

        } catch (error) {
            console.error('Error en obtenerProductosMasVendidos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

export default ventasController;