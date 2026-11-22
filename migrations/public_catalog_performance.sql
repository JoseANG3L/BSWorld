-- Consultas de solo lectura para el catálogo, el buscador y el banner.
BEGIN;

CREATE OR REPLACE VIEW public.public_mod_catalog
WITH (security_invoker = true) AS
SELECT c.id, c.titulo, c.imagen, c.descargas, c.creadores, c.tags, c.aporte,
       c.vistas, c.likes_count, c.tipo, c.creado, c.estado, c.visibilidad, c.parent_id,
       concat_ws(' ', c.titulo, c.descripcion,
         (SELECT string_agg(tag, ' ') FROM jsonb_array_elements_text(
           CASE WHEN jsonb_typeof(to_jsonb(c.tags)) = 'array' THEN to_jsonb(c.tags)
                ELSE jsonb_build_array(c.tags) END) AS t(tag)),
         (SELECT string_agg(CASE WHEN jsonb_typeof(creator) = 'string' THEN creator #>> '{}'
                                 ELSE coalesce(creator->>'nombre', creator->>'username') END, ' ')
          FROM jsonb_array_elements(CASE WHEN jsonb_typeof(to_jsonb(c.creadores)) = 'array'
                                         THEN to_jsonb(c.creadores) ELSE jsonb_build_array(c.creadores) END) AS u(creator))
       ) AS search_text,
       coalesce((SELECT sum((d->>'count')::numeric) FROM jsonb_array_elements(
         CASE WHEN jsonb_typeof(to_jsonb(c.descargas)) = 'array' THEN to_jsonb(c.descargas)
              ELSE '[]'::jsonb END) AS downloads(d) WHERE d->>'count' ~ '^[0-9]+$'), 0) AS download_count
FROM public.content c
WHERE c.estado = 'aceptado' AND c.visibilidad = 'publico' AND c.parent_id IS NULL;

CREATE OR REPLACE VIEW public.public_mod_stats
WITH (security_invoker = true) AS
SELECT count(*) AS mods, coalesce(sum(download_count), 0) AS downloads,
       (SELECT count(*) FROM public.users) AS users
FROM public.public_mod_catalog;

-- Los permisos predeterminados de Supabase pueden incluir escritura.
REVOKE ALL ON public.public_mod_catalog, public.public_mod_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_mod_catalog, public.public_mod_stats TO anon, authenticated;
COMMIT;
