-- =============================================================================
-- COFRADÍA YGGDRASIL — Seed SQL (Datos Iniciales)
-- Ejecutar DESPUÉS de schema.sql y rls.sql
-- =============================================================================
-- Inserta las plataformas por defecto. Los íconos usan URLs de Simple Icons CDN
-- (SVG de marca, licencia CC0). Se pueden reemplazar por íconos locales.
-- =============================================================================

INSERT INTO platforms (name, icon_url, base_url, color, is_active) VALUES
(
    'YouTube',
    'https://cdn.simpleicons.org/youtube/FF0000',
    'https://www.youtube.com',
    '#FF0000',
    true
),
(
    'TikTok',
    'https://cdn.simpleicons.org/tiktok/000000',
    'https://www.tiktok.com',
    '#000000',
    true
),
(
    'Patreon',
    'https://cdn.simpleicons.org/patreon/FF424D',
    'https://www.patreon.com',
    '#FF424D',
    true
),
(
    'Instagram',
    'https://cdn.simpleicons.org/instagram/E4405F',
    'https://www.instagram.com',
    '#E4405F',
    true
),
(
    'Facebook',
    'https://cdn.simpleicons.org/facebook/1877F2',
    'https://www.facebook.com',
    '#1877F2',
    true
),
(
    'X / Twitter',
    'https://cdn.simpleicons.org/x/000000',
    'https://www.x.com',
    '#000000',
    true
),
(
    'Twitch',
    'https://cdn.simpleicons.org/twitch/9146FF',
    'https://www.twitch.tv',
    '#9146FF',
    true
),
(
    'LinkedIn',
    'https://cdn.simpleicons.org/linkedin/0A66C2',
    'https://www.linkedin.com',
    '#0A66C2',
    true
),
(
    'Sitio Web',
    'https://cdn.simpleicons.org/googlechrome/4285F4',
    '',
    '#4285F4',
    true
),
(
    'Otro',
    'https://cdn.simpleicons.org/linktree/43E55E',
    '',
    '#6B7280',
    true
)
ON CONFLICT DO NOTHING;
