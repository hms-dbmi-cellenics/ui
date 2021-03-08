export default {
  processing: {
    meta: {
      complete: false,
      stepsDone: new Set([]),
      loading: true,
      completingStepError: false,
      loadingSettingsError: false,
    },
    dataIntegration: {
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
        excludeGeneCategories: [],
      },
    },
    configureEmbedding: {
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
    },
  },
};
