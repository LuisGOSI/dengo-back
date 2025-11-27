import { supabase } from '../config/supabase';

const expo_controller = {

    guardarExpoToken: async (req, res) => {
        const { user_id, expo_token } = req.body;

        if(!user_id || !expo_token) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update({ expo_push_token: expo_token })
                .eq('id', user_id);

            if (error) {
                return res.status(500).json({ error: 'Error al guardar el token' });
            }

            res.json({ message: 'Token guardado correctamente', data });
        } catch (err) {
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
}

export default expo_controller;

