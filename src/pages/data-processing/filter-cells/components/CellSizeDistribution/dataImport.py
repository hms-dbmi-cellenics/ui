import json
jsonData = []
i=0
with open('cellRank_data.json') as json_file:

    data = json.load(json_file)
    sort_orders = sorted(data.items(), key=lambda x: x[1], reverse=True)
    for k, v in sort_orders:
        jsonData.append({
            'u': i,
            'rank': v
        })
        i+=1
    print(jsonData)
with open('cellRank_sorted.json', 'w') as outfile:
     json.dump(jsonData, outfile)
