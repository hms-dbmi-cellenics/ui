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
      enabled: true,
      auto: true,
      filterSettings: {
        FDR: 0.1,
      },
    },
    numGenesVsNumUmis: {
      enabled: true,
      auto: true,
      filterSettings: {
        regressionType: 'gam',
        regressionTypeSettings: {
          gam: {
            'p.level': 0.00009,
          },
        },
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
            normalization: 'logNormalize',
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
