import json

tsne_data = []

with open("linnarsson.cells.json") as f:
    data = json.load(f)
    for cell in data.keys():
        tsne_data.append(data[cell]["mappings"]["t-SNE"])

with open("tsne_data.json", "w") as f2:
    json.dump(tsne_data, f2)