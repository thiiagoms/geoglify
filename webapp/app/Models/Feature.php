<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\CreatedUpdatedBy;

class Feature extends Model
{
    use SoftDeletes, CreatedUpdatedBy;

    protected $fillable = [
        'name',
        'description',
        'geojson',
        'layer_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function layer()
    {
        return $this->belongsTo(Layer::class);
    }
}
