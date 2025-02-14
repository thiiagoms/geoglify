DROP VIEW IF EXISTS ships_latest_positions_view;

CREATE OR REPLACE VIEW ships_latest_positions_view AS
WITH latest_positions AS (
    SELECT DISTINCT ON (mmsi) mmsi, updated_at, geojson, geom, eta, destination, cog, sog, hdg, last_updated
    FROM ship_realtime_positions
    WHERE geojson IS NOT NULL
      AND geojson::jsonb @> '{"type": "Point", "coordinates": [0, 0]}' = false
      AND geojson::jsonb @> '{"type": "Point", "coordinates": [null, null]}' = false
      AND updated_at > NOW() - INTERVAL '2 hours'
    ORDER BY mmsi, updated_at DESC
)
SELECT 
    LEFT(ships.mmsi::text, 3) AS country_code,
    ships.id,
    ships.mmsi,
    ships.name,
    ships.callsign,
    ships.imo,
    ships.dim_a,
    ships.dim_b,
    ships.dim_c,
    ships.dim_d,
    cargo_types.code AS cargo_type_code,
    cargo_types.name AS cargo_type_name,
    cargo_categories.name AS cargo_category_name,
    cargo_categories.color AS cargo_category_color,
    cargo_categories.priority AS cargo_category_priority,
    ships.draught,
    lp.cog,
    lp.sog,
    lp.hdg,
    lp.last_updated,
    lp.eta,
    lp.destination,
    lp.geojson,
    lp.geom,
    lp.updated_at AS position_updated_at,
    countries.iso_code AS country_iso_code,
    countries.name AS country_name
FROM ships
INNER JOIN latest_positions lp ON ships.mmsi = lp.mmsi
LEFT JOIN cargo_types ON ships.cargo_type_id = cargo_types.id
LEFT JOIN cargo_categories ON cargo_types.cargo_category_id = cargo_categories.id
LEFT JOIN countries ON LEFT(ships.mmsi::text, 3) = countries.number::text
WHERE ships.mmsi IS NOT NULL;
