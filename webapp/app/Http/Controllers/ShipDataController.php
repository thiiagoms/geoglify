<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\ProcessShipDataBatch;

class ShipDataController extends Controller
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
}