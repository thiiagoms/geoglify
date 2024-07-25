<?php

namespace App\Http\Controllers;

use App\Models\Layer;
use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LayerController extends Controller
{
    public function index(Request $request)
    {
        $itemsPerPage = $request->input('itemsPerPage', 20);
        $page = $request->input('page', 1);
        $searchText = $request->input('searchText', '');

        $query = Layer::query();

        if (!empty($searchText)) {
            $query->where('name', 'like', '%' . $searchText . '%');
            $query->orWhere('description', 'like', '%' . $searchText . '%');
        }

        $query->orderBy('id');

        $layers = $query->paginate($itemsPerPage, ['*'], 'page', $page);

        return response()->json([
            'items' => $layers->items(),
            'total' => $layers->total(),
        ]);
    }

    public function store(Request $request)
    {
        // create layer
        $layer = new Layer;
        $layer->name = $request->name;
        $layer->description = $request->description;
        $layer->type = $request->type;
        $layer->is_active = $request->is_active;
        $layer->style = $request->style;
        $layer->datasource = $request->datasource;
        $layer->updated_by = auth()->user()->id;
        $layer->created_by = auth()->user()->id;
        $layer->save();

        return $layer;
    }

    public function show($id)
    {
        $layer = Layer::find($id);
        return $layer;
    }

    public function update(Request $request, $id)
    {
        //update layer information
        $layer = Layer::find($id);
        $layer->name = $request->name;
        $layer->description = $request->description;
        $layer->datasource = $request->datasource;
        $layer->is_active = $request->is_active;
        $layer->updated_by = auth()->user()->id;
        $layer->save();

        return $layer;
    }

    public function update_style(Request $request, $id)
    {
        //update layer style
        $layer = Layer::find($id);
        $layer->style = $request->all();
        $layer->updated_by = auth()->user()->id;
        $layer->save();

        return $layer;
    }

    public function upload_data(Request $request, $id)
    {
        // Get layer
        $layer = Layer::findOrFail($id);

        // Handle GeoJSON file upload
        if ($request->hasFile('file')) {

            // Replace features
            DB::transaction(function () use ($request, $layer, $id) {

                // Delete existing features
                $layer->features()->delete();

                // Get uploaded file
                $file = $request->file('file');

                // Process GeoJSON file
                $geojson = json_decode(file_get_contents($file->getPathname()), true);

                if (isset($geojson['features'])) {
                    // Prepare data for bulk insert
                    $featuresData = [];
                    $userId = auth()->user()->id;

                    foreach ($geojson['features'] as $f) {
                        $featuresData[] = [
                            'layer_id' => $id,
                            'geojson' => json_encode($f),
                            'created_by' => $userId,
                            'updated_by' => $userId,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                    }

                    // Insert data in chunks
                    $chunks = array_chunk($featuresData, 1000); // Adjust chunk size as needed
                    foreach ($chunks as $chunk) {
                        Feature::insert($chunk);
                    }
                }
            });
        }

        return response()->json("Ok", 200);
    }

    public function destroy($id)
    {
        $layer = Layer::find($id);
        $layer->delete();
        return response()->json("Ok", 200);
    }

    public function features($id)
    {
        $layer = Layer::find($id);
        return $layer->features->pluck('geojson');
    }
}
