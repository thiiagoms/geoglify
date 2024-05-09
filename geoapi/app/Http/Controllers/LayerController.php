<?php

namespace App\Http\Controllers;

use App\Models\Layer;
use Illuminate\Http\Request;
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
            $query->orWhere('code', 'like', '%' . $searchText . '%');
        }

        $query->orderBy('id');

        $layers = $query->paginate($itemsPerPage, ['*'], 'page', $page);

        $layers->transform(function ($layer) {
            $layer->style = json_decode($layer->style, true);
            return $layer;
        });
        
        return response()->json([
            'items' => $layers->items(),
            'total' => $layers->total(),
        ]);
    }

    public function store(Request $request)
    {
        return Layer::create($request->all());
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
        $layer->code = $request->code;
        $layer->style = json_encode($request->style);
        $layer->updated_by = auth()->user()->id;
        $layer->created_by = auth()->user()->id;
        $layer->save();

        Log::emergency($layer);

        //replace features
        /*$layer->features()->delete();

        foreach ($request->features as $feature) {
            dd($feature);
        }*/

        return $layer;
    }

    public function destroy($id)
    {
        $layer = Layer::find($id);
        $layer->delete();
        return response()->json(null, 204);
    }

}
