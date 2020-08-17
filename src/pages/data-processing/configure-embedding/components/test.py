import json
jsonData = {}
jsonData['cells'] = []
with open('new_categoricalUMAP.json') as json_file:
    data = json.load(json_file)
    
    for i in range(len(data[0]['cell'])):
        for j in range(len(data)-1):
            if data[j+1]['cell_id'] in data[0]['cell'][i]: 
                data[j+1].update({
                   'doubletScore': data[0]['doubletScore'][i]
                })
            else:
                data[j+1].update({
                   'doubletScore': 'NaN'
                })

with open('new_data.json', 'w') as outfile:
     json.dump(data, outfile)