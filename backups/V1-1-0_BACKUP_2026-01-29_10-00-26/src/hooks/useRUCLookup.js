
import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export function useRUCLookup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const searchRUC = async (ruc) => {
    if (!ruc) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('razon_social')
        .eq('ruc', ruc)
        .single();

      if (error) {
        // If error code is PGRST116, it means no rows found (not a system error)
        if (error.code !== 'PGRST116') {
             console.error('RUC Search Error:', error);
        }
        return null;
      }
      return data?.razon_social;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveRUC = async (ruc, razon_social) => {
    if (!ruc || !razon_social || ruc === '0') return 'invalid';
    
    try {
      const { error } = await supabase
        .from('clientes')
        .insert([{ ruc, razon_social }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
            return 'duplicate';
        }
        throw error;
      }
      return true; // Success
    } catch (error) {
      console.error('RUC Save Error:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo guardar el cliente nuevo.", 
        variant: "destructive" 
      });
      return false;
    }
  };

  return { searchRUC, saveRUC, loading };
}
