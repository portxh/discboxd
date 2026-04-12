import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// =========================================================================
// CONFIGURAÇÕES DO SUPABASE
// Fornece a instância do cliente Supabase para toda a aplicação
// =========================================================================

const SUPABASE_URL = 'https://kozooioikwxemdkkrkqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtvem9vaW9pa3d4ZW1ka2tya3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Mzk3MzYsImV4cCI6MjA4OTExNTczNn0.vOShi8FNzZDKMCJfJ_bNFaWBa0CGKnqD6_TjZlUwcNM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
