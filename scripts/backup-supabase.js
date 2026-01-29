
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const getEnvVar = (name) => {
    const match = envContent.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
    'clientes',
    'productos',
    'ventas',
    'detalles_ventas',
    'facturas',
    'movimientos_caja',
    'caja',
    'caja_aperturas',
    'invoice_designs'
];

async function backup() {
    console.log('--- Iniciando Resguardo de Datos (Supabase) ---');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `DATA_SUPABASE_${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    for (const table of tables) {
        console.log(`Exportando tabla: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
            console.error(`Error al exportar ${table}:`, error.message);
            continue;
        }

        const filePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ ${table} guardado (${data.length} registros)`);
    }

    console.log(`\n--- Resguardo completado en: ${backupDir} ---`);
}

backup();
