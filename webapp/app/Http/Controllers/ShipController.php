<?php

namespace App\Http\Controllers;

use App\Models\ShipLatestPositionView;
use App\Models\Ship;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use App\Jobs\ProcessShipDataBatch;
use Inertia\Inertia;

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
            return redirect('/')->with('error', 'IMO não encontrado.');
        }

        // Search for the position of the ship in real-time
        $realtimePosition = ShipLatestPositionView::where('mmsi', $ship->mmsi)->first();

        // If the real-time position is not found, redirect or return an error message
        if (!$realtimePosition) {
            return redirect('/')->with('error', 'IMO não encontrado.');
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
        // Search for the ship by IMO
        $ship = Ship::where('mmsi', $mmsi)->first();

        // Search for the ship by MMSI
        $realtimePosition = ShipLatestPositionView::where('mmsi', $mmsi)->first();

        // If the ship or its real-time position is not found, redirect or return an error message
        if (!$ship || !$realtimePosition) {
            return redirect('/')->with('error', 'MMSI não encontrado.');
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
    function highlightString($str, $search_terms)
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
