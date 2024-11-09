<?php

namespace App\Models;

use App\Traits\CreatedUpdatedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Searoute extends Model
{
    use HasFactory, CreatedUpdatedBy;

    protected $fillable = ['geojson'];
}
