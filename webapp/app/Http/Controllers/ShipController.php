<?php

namespace App\Http\Controllers;

use App\Models\ShipLatestPositionView;
use App\Models\Ship;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use App\Jobs\ProcessShipDataBatch;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ShipController extends Controller
{
    /**
     * Store incoming ship data in batches and dispatch job.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $data = $request->all();

        if (!is_array($data) || empty($data)) {
            return response()->json(['message' => 'Invalid data format or empty batch'], 422);
        }

        // Dispatch the job with the batch of ship data
        ProcessShipDataBatch::dispatch($data);

        return response()->json(['message' => 'Batch processing started'], 202);
    }

    /**
     * Returns a list of all ships in real-time view.
     */
    public function all()
    {
        return response()->json(ShipLatestPositionView::all());
    }

    /**
     * Shows the Livemap with the ship's coordinates based on IMO.
     *
     * @param string $imo
     * @return \Inertia\Response
     */
    public function showByImo($imo)
    {
        // Search for the ship by IMO
        $ship = Ship::where('imo', $imo)->first();

        // If the ship is not found, redirect or return an error message
        if (!$ship) {
            return redirect('/')->with('error', 'IMO not found.');
        }

        // Search for the position of the ship in real-time
        $realtimePosition = ShipLatestPositionView::where('mmsi', $ship->mmsi)->first();

        // If the real-time position is not found, redirect or return an error message
        if (!$realtimePosition) {
            return redirect('/')->with('error', 'Real-time position not found.');
        }

        // Pass the data to the dashboard
        return Inertia::render('Livemap', [
            'ship' => $ship,
            'realtimePosition' => $realtimePosition,
        ]);
    }

    /**
     * Show the Livemap with the ship's coordinates based on MMSI.
     *
     * @param string $mmsi
     * @return \Inertia\Response
     */
    public function showByMmsi($mmsi)
    {
        // Search for the ship by MMSI
        $ship = Ship::where('mmsi', $mmsi)->first();
        
        // If the ship is not found, redirect or return an error message
        if (!$ship) {
            return redirect('/')->with('error', 'MMSI not found.');
        }

        // Search for the ship's real-time position by MMSI
        $realtimePosition = ShipLatestPositionView::where('mmsi', $mmsi)->first();

        // If the ship or its real-time position is not found, redirect or return an error message
        if (!$realtimePosition) {
            return redirect('/')->with('error', 'MMSI not found.');
        }

        // Pass the data to the dashboard
        return Inertia::render('Livemap', [
            'ship' => $ship,
            'realtimePosition' => $realtimePosition,
        ]);
    }

    /**
     * Returns details of a specific ship based on MMSI number.
     */
    public function details($mmsi)
    {
        $ship = ShipLatestPositionView::where('mmsi', $mmsi)->first();

        return response()->json($ship);
    }

    /**
     * Returns a list of ships based on search text (GET)
     */
    public function search(Request $request)
    {
        // Define pagination parameters
        $text = $request->input('text');

        // Perform the search directly
        $realtimeShips = empty(trim($text))
            ? ShipLatestPositionView::all()
            : ShipLatestPositionView::search($text)->get();

        // Filter first 5 ships
        $realtimeShips = $realtimeShips->take(5);

        // Highlight search term in the results
        $realtimeShips = $realtimeShips->transform(function ($ship) use ($text) {
            $ship->name = $this->highlightString($ship->name, $text);
            $ship->imo = $this->highlightString($ship->imo, $text);
            $ship->callsign = $this->highlightString($ship->callsign, $text);
            $ship->mmsi = $this->highlightString($ship->mmsi, $text);
            $ship->destination = $this->highlightString($ship->destination, $text);
            $ship->country_name = $this->highlightString($ship->country_name, $text);
            $ship->cargo_name = $this->highlightString($ship->cargo_name, $text);
            return $ship;
        });

        return response()->json($realtimeShips);
    }

    // Helper function to highlight search terms in a string
    private function highlightString($str, $search_terms)
    {
        if (empty($search_terms)) {
            return $str;
        }

        $terms = explode(' ', $search_terms);

        foreach ($terms as $term) {
            if (!empty($term)) {
                $str = preg_replace('/(' . preg_quote($term, '/') . ')/i', '<em>$1</em>', $str);
            }
        }

        return $str;
    }

    /**
     * Fetches and returns the photo of a ship based on ID
     */
    public function photo($id)
    {
        $ship = Ship::find($id);

        // Check if the ship exists
        if (!$ship) {
            Log::info("Ship with ID {$id} not found.");
            return $this->getPlaceholderImage();
        }

        $imo = $ship->imo;

        // Check if the IMO is defined
        if (empty($imo)) {
            Log::info("IMO not defined for ship with ID {$id}.");
            return $this->getPlaceholderImage();
        }

        // Define the path where the photo is stored
        $photoPath = "ships/photos/{$imo}.jpeg";

        // Check if the photo already exists in storage
        if (Storage::exists($photoPath)) {
            return $this->getStoredPhoto($photoPath);
        }

        // Fetch the photo from MarineTraffic
        $photoContent = $this->fetchPhotoFromMarineTraffic($imo);

        // If the photo is fetched successfully, store it and return it
        if ($photoContent) {
            Storage::put($photoPath, $photoContent);
            return $this->respondWithImage($photoContent);
        }

        // If all else fails, return the placeholder image
        return $this->getPlaceholderImage();
    }

    /**
     * Fetches photo from MarineTraffic based on IMO number.
     */
    private function fetchPhotoFromMarineTraffic($imo)
    {
        $photoUrl = "https://photos.marinetraffic.com/ais/showphoto.aspx?imo={$imo}";

        try {
            $photoContent = file_get_contents($photoUrl);

            // Check if the content was fetched successfully
            if ($photoContent === false) {
                Log::error("Failed to fetch photo from MarineTraffic for IMO: {$imo}");
                return null;
            }

            return $photoContent;
        } catch (\Exception $e) {
            Log::error("Exception while fetching photo from MarineTraffic for IMO: {$imo} - " . $e->getMessage());
            return null;
        }
    }

    /**
     * Returns a placeholder image from storage.
     */
    private function getPlaceholderImage()
    {
        $placeholderPath = "public/images/placeholder.jpg";

        // Check if the placeholder exists
        if (!Storage::exists($placeholderPath)) {
            Log::error("Placeholder not found at path: {$placeholderPath}");
            return response('Placeholder not found', 404);
        }

        $file = Storage::get($placeholderPath);
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
        if (empty($file)) {
            Log::error("Image content is empty or invalid.");
            return response('Invalid image', 500);
        }

        return response($file, 200)->header('Content-Type', 'image/jpeg');
    }
}
