import { supabase } from "../config/supabase.js";

export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};