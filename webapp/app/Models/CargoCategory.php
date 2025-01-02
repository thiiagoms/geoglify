<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CargoCategory extends Model
{
    use HasFactory;

    // Definindo os campos que são preenchíveis
    protected $fillable = ['name', 'color'];

    /**
     * Relacionamento com CargoType
     */
    public function cargoTypes()
    {
        return $this->hasMany(CargoType::class);
    }
}
