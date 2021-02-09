const dataIntegration = {
  dataIntegration: {
    method: 'seuratv4',
    methodSettings: {
      seuratv4: {
        numGenes: 2000,
        normalisation: 'logNormalise',
      },
    },
  },
  dimensionalityReduction: {
    method: 'rpca',
    numPCs: 30,
    variationExplained: 91,
    excludeGeneCategories: [],
  },
};

const configureEmbedding = {
  embeddingSettings: {
    method: 'umap',
    methodSettings: {
      umap: {
        minimumDistance: 0.1,
        distanceMetric: 'euclidean',
      },
      tsne: {
        perplexity: 30,
        learningRate: 200,
      },
    },
  },
  clusteringSettings: {
    method: 'louvain',
    methodSettings: {
      louvain: {
        resolution: 0.5,
      },
    },
  },
};

export default {
  root: {},
  meta: {},
  processing: {},
};

const initialProcessingState = {
  configureEmbedding,
  dataIntegration,
};

export { initialProcessingState };
