import json
jsonData = {}
jsonData['cells'] = []
with open('new_embedding_categorical.json') as json_file:
    data = json.load(json_file)
    for i in range(len(data['embedding'])):
        jsonData['cells'].append({
            'cell_id': data['cells'][i],
            'cluster_id': data['categories'][0]['values'][i],
            'UMAP_1': data['embedding'][i][0],
            'UMAP_2': data['embedding'][i][1],
        })
with open('new_categoricalUMAP.json', 'w') as outfile:
    json.dump(jsonData, outfile)
