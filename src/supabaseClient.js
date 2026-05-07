import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vppsfnzpavahgekkhapx.supabase.co";
const supabaseKey = "sb_publishable_c5ZKQdC8irDvruz7tEnvVQ_vrd7eiV3";

export const supabase = createClient(supabaseUrl, supabaseKey);