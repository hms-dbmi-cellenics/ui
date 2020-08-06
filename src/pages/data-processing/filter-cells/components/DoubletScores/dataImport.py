import json
jsonData = {}
jsonData['cells'] = []
with open('data.json') as json_file:
    data = json.load(json_file)
    for i in range(len(data['doubletP'])):
        jsonData['cells'].append({
            'doubletP': data['doubletP'][i],
            'size': data['size'][i],
        })
with open('new_data.json', 'w') as outfile:
    json.dump(jsonData, outfile)
