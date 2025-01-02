<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CargoType extends Model
{
    use HasFactory;

    // Definindo os campos que são preenchíveis
    protected $fillable = ['code', 'description', 'cargo_category_id'];

    /**
     * Relacionamento com CargoCategory
     */
    public function cargoCategory()
    {
        return $this->belongsTo(CargoCategory::class);
    }
}
