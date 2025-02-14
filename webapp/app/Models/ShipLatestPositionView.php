<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class ShipLatestPositionView extends Model
{
    use Searchable;

    // Define that this model maps to a view (not a physical table)
    protected $table = 'ships_latest_positions_view';

    // No need to define fillable attributes for a read-only view
    protected $guarded = [];

    /**
     * Get the name of the index associated with the model.
     */
    public function searchableAs(): string
    {
        return 'ship_latest_position_view_index';
    }

    /**
     * Get the array of searchable data for the model.
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray()
    {
        return [
            'id' => (string) $this->id,
            'mmsi' => (string) $this->mmsi,
            'imo' => (string) $this->imo,
            'name' => (string) $this->name,
            'callsign' => (string) $this->callsign,
            'destination' => (string) $this->destination,
            'cargo_type_name' => (string) $this->cargo_type_name,
            'cargo_category_name' => (string) $this->cargo_category_name,
            'country_name' => (string) $this->country_name,
            'country_iso_code' => (string) $this->country_iso_code,
        ];
    }
}
