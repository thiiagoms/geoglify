<?php

namespace App\Http\Controllers;

use App\Models\ShipLatestPositionView;
use App\Models\Ship;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use App\Jobs\ProcessShipDataBatch;
use Illuminate\Support\Facades\DB;

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
     * Returns details of a specific ship based on MMSI number.
     */
    public function details($mmsi)
    {
        $ship = ShipLatestPositionView::where('mmsi', $mmsi)->first();

        return response()->json($ship);
    }

    /**
     * Returns a paginated list of ships based on search parameters.
     */
    public function search(Request $request)
    {
        // Pagination and search parameters
        $itemsPerPage = $request->input('itemsPerPage', 5);
        $page = $request->input('page', 1);
        $search = $request->input('search', '');

        // Perform the search directly
        $realtimeShips = empty(trim($search))
            ? ShipLatestPositionView::all()
            : ShipLatestPositionView::search($search)->get();

        // Total count and apply pagination
        $total = $realtimeShips->count();
        $paginatedShips = $realtimeShips->forPage($page, $itemsPerPage)->values();

        // Highlight search term in the results
        $paginatedShips = $paginatedShips->transform(function ($ship) use ($search) {
            $ship->name = $this->highlightString($ship->name, $search);
            $ship->imo = $this->highlightString($ship->imo, $search);
            $ship->callsign = $this->highlightString($ship->callsign, $search);
            $ship->mmsi = $this->highlightString($ship->mmsi, $search);
            $ship->destination = $this->highlightString($ship->destination, $search);
            $ship->country_name = $this->highlightString($ship->country_name, $search);
            $ship->cargo_name = $this->highlightString($ship->cargo_name, $search);
            return $ship;
        });

        // Return JSON response with paginated data
        return response()->json([
            'filtered_items' => $realtimeShips,
            'paginated_items' => $paginatedShips,
            'total' => $total,
        ]);
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
