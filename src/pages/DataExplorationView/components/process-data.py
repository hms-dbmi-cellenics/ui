import json

mydata = []

with open("linnarsson.cells.json") as f:
    data = json.load(f)
    for cell in data.keys():
        mydata.append(data[cell]["mappings"]["PCA"])

with open("sample.json", "w") as outfile: 
    json.dump(mydata, outfile)
