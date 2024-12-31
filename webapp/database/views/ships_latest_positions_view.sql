-- This view is used to get the latest position of each ship in the database.

-- Drop the view if it exists
DROP VIEW IF EXISTS ships_latest_positions_view;

CREATE OR REPLACE VIEW ships_latest_positions_view AS
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
    cargo_types.code AS cargo_code,
    cargo_types.category AS cargo_name,
    ships.draught,
    ship_realtime_positions.cog,
    ship_realtime_positions.sog,
    ship_realtime_positions.hdg,
    ship_realtime_positions.last_updated,
    ship_realtime_positions.eta,
    ship_realtime_positions.destination,
    ship_realtime_positions.geojson,
    ship_realtime_positions.geom,
    ship_realtime_positions.created_at,
    ship_realtime_positions.updated_at,
    countries.iso_code AS country_iso_code,
    countries.name AS country_name
FROM ships
INNER JOIN (
    SELECT DISTINCT ON (mmsi) *
    FROM ship_realtime_positions
    ORDER BY mmsi, updated_at DESC
) AS ship_realtime_positions
    ON ships.mmsi = ship_realtime_positions.mmsi
LEFT JOIN cargo_types
    ON ships.cargo = cargo_types.code::varchar
LEFT JOIN countries
    ON LEFT(ships.mmsi::text, 3) = countries.number::text
WHERE ship_realtime_positions.updated_at IS NOT NULL;