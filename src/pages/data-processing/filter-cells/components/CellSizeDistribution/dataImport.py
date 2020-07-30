import json
jsonData = {}
jsonData['cells'] = []
with open('data.json') as json_file:
    data = json.load(json_file)
    for i in range(len(data)):
        jsonData['cells'].append({
            'category': i,
            'ammount': data[i],
        })
with open('new_data2.json', 'w') as outfile:
    json.dump(jsonData, outfile)
