import json
jsonData = {}
jsonData['cells'] = []
with open('new_embedding_continuous.json') as json_file:
    data = json.load(json_file)
    for i in range(len(data['embedding'])):
        jsonData['cells'].append({
            'cell_id': data['cells'][i],
            'UMAP_1': data['embedding'][i][0],
            'UMAP_2': data['embedding'][i][1],
            'CST3' : data['categories'][0]['values'][i]
        })
with open('new_basicUMAP.json', 'w') as outfile:
    json.dump(jsonData, outfile)
