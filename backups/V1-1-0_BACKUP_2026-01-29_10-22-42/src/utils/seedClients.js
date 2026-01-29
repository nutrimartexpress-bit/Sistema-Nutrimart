
import { supabase } from '@/lib/customSupabaseClient';

const clientsData = [
  { ruc: "80001001-1", razon_social: "SUPERMERCADO STOCK S.A." },
  { ruc: "80001002-2", razon_social: "FARMACIA PUNTO FARMA" },
  { ruc: "80001003-3", razon_social: "BODEGA EL PATRON" },
  { ruc: "80001004-4", razon_social: "DESPENSA LA FAMILIA" },
  { ruc: "80001005-5", razon_social: "COMERCIAL RUBENCITO" },
  { ruc: "80001006-6", razon_social: "ESTACION DE SERVICIOS SHELL" },
  { ruc: "80001007-7", razon_social: "COOPERATIVA UNIVERSITARIA" },
  { ruc: "80001008-8", razon_social: "BANCO FAMILIAR S.A.E.C.A." },
  { ruc: "80001009-9", razon_social: "LIBRERIA NOVA" },
  { ruc: "80001010-0", razon_social: "FERRETERIA AMERICANA" },
  { ruc: "80001011-1", razon_social: "CASA PARANA S.A." },
  { ruc: "80001012-2", razon_social: "SHOPPING DEL SOL" },
  { ruc: "80001013-3", razon_social: "BURGER KING PARAGUAY" },
  { ruc: "80001014-4", razon_social: "MCDONALDS S.A." },
  { ruc: "80001015-5", razon_social: "PIZZA HUT" },
  { ruc: "80001016-6", razon_social: "CLINICA LA COSTA" },
  { ruc: "80001017-7", razon_social: "SANATORIO MIGONE" },
  { ruc: "80001018-8", razon_social: "ASEGURADORA YACYRETA" },
  { ruc: "80001019-9", razon_social: "TIGO PARAGUAY" },
  { ruc: "80001020-0", razon_social: "PERSONAL ENVIOS" },
  { ruc: "80001021-1", razon_social: "CLARO PARAGUAY" },
  { ruc: "80001022-2", razon_social: "ANDE" },
  { ruc: "80001023-3", razon_social: "ESSAP S.A." },
  { ruc: "80001024-4", razon_social: "COPACO S.A." },
  { ruc: "80001025-5", razon_social: "MUNICIPALIDAD DE ASUNCION" },
  { ruc: "80001026-6", razon_social: "MINISTERIO DE HACIENDA" },
  { ruc: "80001027-7", razon_social: "UNIVERSIDAD NACIONAL DE ASUNCION" },
  { ruc: "80001028-8", razon_social: "UNIVERSIDAD CATOLICA" },
  { ruc: "80001029-9", razon_social: "COLEGIO INTERNACIONAL" },
  { ruc: "80001030-0", razon_social: "COLEGIO SAN JOSE" },
  { ruc: "80001031-1", razon_social: "CLUB OLIMPIA" },
  { ruc: "80001032-2", razon_social: "CLUB CERRO PORTENO" },
  { ruc: "80001033-3", razon_social: "TOYOTA PARAGUAY" },
  { ruc: "80001034-4", razon_social: "GARDEN AUTOMOTORES" },
  { ruc: "80001035-5", razon_social: "CENSU S.A." },
  { ruc: "80001036-6", razon_social: "CHACOMER S.A." },
  { ruc: "80001037-7", razon_social: "INVERFIN S.A.E.C.A." },
  { ruc: "80001038-8", razon_social: "TUPÍ ELECTRODOMÉSTICOS" },
  { ruc: "80001039-9", razon_social: "BRISTOL S.A." },
  { ruc: "80001040-0", razon_social: "ALEX S.A." },
  { ruc: "80001041-1", razon_social: "METALURGICA VERA" },
  { ruc: "80001042-2", razon_social: "VIDRIERIA CRISTAL" },
  { ruc: "80001043-3", razon_social: "CARPINTERIA EL CEDRO" },
  { ruc: "80001044-4", razon_social: "PANADERIA LA PALMERA" },
  { ruc: "80001045-5", razon_social: "CONFITERIA EL MOLINO" }
];

export async function seedClients() {
  console.log('%c🌱 Starting Client Migration...', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
  console.log(`Processing ${clientsData.length} records...`);
  
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const client of clientsData) {
      try {
          // Check existence first to log accurately
          const { data: existing } = await supabase
              .from('clientes')
              .select('id')
              .eq('ruc', client.ruc)
              .single();

          if (existing) {
              console.log(`%c⚠️ Skipped (Exists): ${client.ruc} - ${client.razon_social}`, 'color: #f59e0b;');
              skippedCount++;
              continue;
          }

          const { error } = await supabase
              .from('clientes')
              .insert([client]);
              
          if (error) throw error;
          
          console.log(`%c✅ Inserted: ${client.ruc} - ${client.razon_social}`, 'color: #10b981;');
          successCount++;
          
      } catch (err) {
          console.error(`❌ Error inserting ${client.ruc}:`, err.message);
          errorCount++;
      }
  }

  const summaryStyle = 'font-weight: bold; font-size: 14px; padding: 10px; border-radius: 5px;';
  
  if (errorCount > 0) {
      console.log(`%c🏁 Migration Complete with Errors\n✅ Success: ${successCount}\n⚠️ Skipped: ${skippedCount}\n❌ Errors: ${errorCount}`, `background: #fee2e2; color: #b91c1c; ${summaryStyle}`);
  } else {
      console.log(`%c🏁 Migration Complete Successfully\n✅ Success: ${successCount}\n⚠️ Skipped: ${skippedCount}\n❌ Errors: ${errorCount}`, `background: #d1fae5; color: #047857; ${summaryStyle}`);
  }
  
  return { successCount, skippedCount, errorCount };
}
