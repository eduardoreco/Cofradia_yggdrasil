-- =============================================================================
-- COFRADÍA YGGDRASIL — Schema SQL
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLA: platforms — Catálogo de plataformas (YouTube, TikTok, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS platforms (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    icon_url   text,
    base_url   text,
    color      text DEFAULT '#6B7280',
    is_active  boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- TABLA: nodes — Ramas del árbol (temas y sub-temas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS nodes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id    uuid REFERENCES nodes(id) ON DELETE CASCADE,
    name         text NOT NULL,
    description  text,
    type         text DEFAULT 'branch' CHECK (type IN ('branch', 'leaf')),
    image_url    text,
    order_index  integer DEFAULT 0,
    is_protected boolean DEFAULT false,   -- TODO: usar cuando se implemente auth
    created_at   timestamptz DEFAULT now(),
    updated_at   timestamptz DEFAULT now(),
    modified_by  text                     -- Nombre libre, opcional
);

-- Índice para acelerar consultas por padre (navegación del árbol)
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes USING gin(to_tsvector('spanish', name));

-- =============================================================================
-- TABLA: leaves — Hojas/links del árbol
-- =============================================================================
CREATE TABLE IF NOT EXISTS leaves (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id     uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    platform_id uuid REFERENCES platforms(id) ON DELETE SET NULL,
    url         text NOT NULL,
    label       text,
    image_url   text,
    order_index integer DEFAULT 0,
    created_at  timestamptz DEFAULT now(),
    modified_by text
);

-- Índice para consultas por nodo padre
CREATE INDEX IF NOT EXISTS idx_leaves_node_id ON leaves(node_id);

-- =============================================================================
-- TABLA: app_settings — Configuración global de la app
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_settings (
    key        text PRIMARY KEY,
    value      text,
    updated_at timestamptz DEFAULT now()
);

-- Valores por defecto de configuración
INSERT INTO app_settings (key, value) VALUES
    ('app_title',   'Cofradía Yggdrasil'),
    ('logo_url',    ''),
    ('logo_alt',    'Logo Institucional')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- TABLA: audit_log — Historial de cambios
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action      text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    entity_type text NOT NULL CHECK (entity_type IN ('node', 'leaf', 'platform', 'setting')),
    entity_id   uuid,
    entity_name text,                    -- Nombre legible del elemento (para mostrar en historial)
    modified_by text,                    -- Puede ser null si no se indicó nombre
    changes     jsonb,                   -- Snapshot de los cambios
    created_at  timestamptz DEFAULT now()
);

-- Índice para historial reciente
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
-- Índice para filtrar por modificador
CREATE INDEX IF NOT EXISTS idx_audit_log_modified_by ON audit_log(modified_by);

-- =============================================================================
-- FUNCIÓN: actualizar updated_at automáticamente en nodes
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nodes_updated_at
    BEFORE UPDATE ON nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
