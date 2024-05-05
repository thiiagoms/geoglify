<?php

namespace App\Http\Controllers;

use App\Models\Layer;
use Illuminate\Http\Request;

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
        }

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

    public function show(Layer $layer)
    {
        return $layer;
    }

    public function update(Request $request, Layer $layer)
    {
        $layer->update($request->all());
        return $layer;
    }

    public function destroy(Layer $layer)
    {
        $layer->delete();
        return response()->json(null, 204);
    }

}
