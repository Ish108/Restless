import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Usage Example:
// export const recordOrder = async (orderDetails) => {
//   const { data, error } = await supabase
//     .from('orders')
//     .insert([orderDetails]);
//   return { data, error };
// };
