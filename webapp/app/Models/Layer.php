<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\CreatedUpdatedBy;

class Layer extends Model
{
    use SoftDeletes, CreatedUpdatedBy;

    protected $fillable = [
        'name',
        'description',
        'type',
        'style',
        'is_active',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function features()
    {
        return $this->hasMany(Feature::class);
    }
}
