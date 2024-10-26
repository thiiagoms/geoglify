<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Ship;

class ShipRealtimePosition extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'mmsi',
        'cog',
        'sog',
        'hdg',
        'last_updated',
        'eta',
        'destination',
        'geojson'
    ];

    /**
     * The attributes that should be hidden for arrays.
     */
    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
        'created_by',
        'updated_by',
        'deleted_by',
        'id',
        "geom"
    ];

    public function ship()
    {
        return $this->belongsTo(Ship::class, 'mmsi', 'mmsi');
    }
}
