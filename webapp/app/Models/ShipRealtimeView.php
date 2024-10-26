<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class ShipRealtimeView extends Model
{
    use Searchable;

    protected $table = 'ships_in_realtime';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'mmsi',
        'name',
        'callsign',
        'imo',
        'updated_at',
        'created_at',
    ];

    /**
     * Get the indexable data array for the model.
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray()
    {
        return [
                // Cast id to string and turn created_at into an int32 timestamp
                // in order to maintain compatibility with the Typesense index definition below
                'id' => (string) $this->id,
                'mmsi' => (string) $this->mmsi,
                'name' => (string) $this->name,
                'callsign' => (string) $this->callsign,
                'imo' => (string) $this->imo,

                // Use the UNIX timestamp for Typesense integration
                // https://typesense.org/docs/26.0/api/collections.html#indexing-dates
                'created_at' => $this->created_at->timestamp,
                'updated_at' => $this->updated_at->timestamp,
        ];
        
    }
}
