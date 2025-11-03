import { supabase } from "../config/supabase.js";


// Get - Traer todos los usuarios
export const getUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select(`
                *,
                roles:rol_id(id, rol),
                niveles_cuenta:nivel_id(id, codigo_nivel),
                sucursales:sucursal_personal_id(id, nombre)
            `)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get - Taer un usuario por ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('usuarios')
            .select(`
                *,
                roles:rol_id(id, rol),
                niveles_cuenta:nivel_id(id, codigo_nivel),
                sucursales:sucursal_personal_id(id, nombre)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//POST - Crear un nuevo usuario
export const createUser = async (req, res) => {
    try {
        const {
            nombre,
            apellidos,
            password,
            email,
            fecha_nacimiento,
            genero,
            telefono,
            rol_id,
            sucursal_personal_id
        } = req.body;

        // Validaciones #Revisar que mas validaciones se necesitan
        if (!email || !nombre || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombre y email son requeridos'
            });
        }

        const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            user_metadata: {
                nombre,
                apellidos,
                fecha_nacimiento,
                genero,
                telefono,
                rol_id, 
                sucursal_personal_id                
            }

        });

        await supabase.from("usuarios").update({
            tipo_cuenta: "personal"
        }).eq('id', data.user.id);

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente'
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

//? PUT - Actualizar un usuario
export const updateUser = async (req, res) => {
    try {
        const updateData = {};

        const { id } = req.params;
        const {
            nombre,
            apellidos,
            genero,
            tipo_cuenta,
            rol_id,
            sucursal_personal_id,
            telefono,
            nivel_id
        } = req.body;

        //Actualizar solo los campos que vienen en el body
        if (nombre !== undefined) updateData.nombre = nombre;
        if (apellidos !== undefined) updateData.apellidos = apellidos;
        if (genero !== undefined) updateData.genero = genero;
        if (tipo_cuenta !== undefined) updateData.tipo_cuenta = tipo_cuenta;
        if (rol_id !== undefined) updateData.rol_id = rol_id;
        if (sucursal_personal_id !== undefined) updateData.sucursal_personal_id = sucursal_personal_id;
        if (telefono !== undefined) updateData.telefono = telefono;
        if (nivel_id !== undefined) updateData.nivel_id = nivel_id;

        const { data, error } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se enviaron campos para actualizar'
            });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
//? DELETE - Eliminación lógica
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('usuarios')
            .update({
                activo: false
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado (inactivado) exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
