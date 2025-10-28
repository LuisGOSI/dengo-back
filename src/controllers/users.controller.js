import { supabase } from "../config/supabase.js";

export const getUsers = async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.status(200).json(data);
};