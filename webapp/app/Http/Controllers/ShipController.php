<?php

namespace App\Http\Controllers;

use App\Models\Ship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ShipController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        // 
    }

    /**
     * Display the specified resource.
     */
    public function show(Ship $ship)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ship $ship)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ship $ship)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ship $ship)
    {
        //
    }

    /**
     * Fetches and returns the photo of a ship based on ID
     */
    public function photo($id)
    {
        $imo = Ship::find($id)->imo;

        // Return placeholder image if the IMO number is empty or not found or null
        if (empty($imo)) {
            return $this->getPlaceholderImage();
        }

        // Define the path where the photo is stored
        $photoPath = "ships/photos/{$imo}.jpeg";

        // Check if the photo already exists in storage
        if (Storage::exists($photoPath)) {
            return $this->getStoredPhoto($photoPath);
        }

        // Fetch photo from MarineTraffic or use placeholder if it fails
        $photoContent = $this->fetchPhotoFromMarineTraffic($imo) ?? Storage::get("public/placeholder.png");

        // Store and return the fetched photo
        Storage::put($photoPath, $photoContent);
        return $this->respondWithImage($photoContent);
    }

    /**
     * Fetches photo from MarineTraffic based on IMO number.
     */
    private function fetchPhotoFromMarineTraffic($imo)
    {
        $photoUrl = "https://photos.marinetraffic.com/ais/showphoto.aspx?imo={$imo}";

        try {
            return file_get_contents($photoUrl);
        } catch (\Exception $e) {
            return null;  // If fetching fails, return null
        }
    }

    /**
     * Returns a placeholder image from storage.
     */
    private function getPlaceholderImage()
    {
        $file = Storage::get("public/placeholder.png");
        return $this->respondWithImage($file);
    }

    /**
     * Returns a stored photo from the given path.
     */
    private function getStoredPhoto($photoPath)
    {
        $file = Storage::get($photoPath);
        return $this->respondWithImage($file);
    }

    /**
     * Returns the image response with appropriate headers.
     */
    private function respondWithImage($file)
    {
        return response($file, 200)->header('Content-Type', 'image/jpeg');
    }
}
