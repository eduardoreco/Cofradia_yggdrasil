-- =============================================================================
-- COFRADÍA YGGDRASIL — Row Level Security (RLS)
-- Ejecutar DESPUÉS de schema.sql
-- =============================================================================
-- VERSIÓN 1: Políticas ABIERTAS — cualquiera puede leer y escribir.
-- TODO: Cuando se implemente autenticación, reemplazar las políticas
--       "allow all" por políticas que restrinjan por usuario/rol.
-- =============================================================================

-- ---- nodes ------------------------------------------------------------------
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- Lectura pública (cualquiera puede ver el árbol)
CREATE POLICY "nodes_select_all" ON nodes
    FOR SELECT USING (true);

-- Escritura pública (v1: sin auth)
-- TODO: Reemplazar con: USING (auth.role() = 'authenticated') cuando se implemente login
CREATE POLICY "nodes_insert_all" ON nodes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "nodes_update_all" ON nodes
    FOR UPDATE USING (true);

CREATE POLICY "nodes_delete_all" ON nodes
    FOR DELETE USING (true);

-- ---- leaves -----------------------------------------------------------------
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaves_select_all" ON leaves
    FOR SELECT USING (true);

CREATE POLICY "leaves_insert_all" ON leaves
    FOR INSERT WITH CHECK (true);

CREATE POLICY "leaves_update_all" ON leaves
    FOR UPDATE USING (true);

CREATE POLICY "leaves_delete_all" ON leaves
    FOR DELETE USING (true);

-- ---- platforms --------------------------------------------------------------
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platforms_select_all" ON platforms
    FOR SELECT USING (true);

CREATE POLICY "platforms_insert_all" ON platforms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "platforms_update_all" ON platforms
    FOR UPDATE USING (true);

CREATE POLICY "platforms_delete_all" ON platforms
    FOR DELETE USING (true);

-- ---- app_settings -----------------------------------------------------------
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_all" ON app_settings
    FOR SELECT USING (true);

CREATE POLICY "settings_insert_all" ON app_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "settings_update_all" ON app_settings
    FOR UPDATE USING (true);

-- ---- audit_log --------------------------------------------------------------
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura y escritura pública (v1)
CREATE POLICY "audit_select_all" ON audit_log
    FOR SELECT USING (true);

CREATE POLICY "audit_insert_all" ON audit_log
    FOR INSERT WITH CHECK (true);

-- No permitir UPDATE ni DELETE en audit_log — el historial es inmutable
-- (No se crean políticas de UPDATE/DELETE = denegado por defecto con RLS activo)
