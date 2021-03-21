export default {
  pipelineStatus: {
    loading: false,
    error: false,
    status: {},
  },
  processing: {
    meta: {
      loading: true,
      completingStepError: false,
      loadingSettingsError: false,
    },
    cellSizeDistribution: {
      filterSettings: {
        minCellSize: 10800,
        binStep: 200,
      },
    },
    mitochondrialContent: {
      filterSettings: {
        method: 'absolute_threshold',
        methodSettings: {
          absolute_threshold: {
            maxFraction: 0.1,
            binStep: 200,
          },
        },
      },
    },
    classifier: {
      filterSettings: {
        minProbability: 0.82,
        bandwidth: -1,
      },
    },
    numGenesVsNumUmis: {
      filterSettings: {
        regressionType: 'gam',
        smoothing: 13,
        upperCutoff: 4.8,
        lowerCutoff: 2.1,
        stringency: 2.1,
        binStep: 0.05,
      },
    },
    doubletScores: {
      filterSettings: {
        probabilityThreshold: 0.2,
        binStep: 0.05,
      },
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
