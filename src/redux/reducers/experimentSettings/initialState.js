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

const initialProcessingState = { configureEmbedding };

export { initialProcessingState };
