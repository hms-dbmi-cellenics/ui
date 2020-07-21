import json
jsonData = {}
jsonData['cells'] = []
with open('data.json') as json_file:
    data = json.load(json_file)
    for i in range(len(data)):
        jsonData['cells'].append({
            'u': data[i],
            
        })
with open('new_data.json', 'w') as outfile:
    json.dump(jsonData, outfile)
    
