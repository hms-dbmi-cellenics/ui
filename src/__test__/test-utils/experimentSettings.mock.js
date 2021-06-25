import initialState, {
  initialPipelineState,
  initialWorkerState,
} from '../../redux/reducers/experimentSettings/initialState';

const sampleifiedConfig = (sampleIds, configToReplicate) => {
  const result = sampleIds.reduce(
    (acum, sampleId) => {
      // eslint-disable-next-line no-param-reassign
      acum[sampleId] = configToReplicate;
      return acum;
    },
    {},
  );

  return result;
};

const generateProcessingConfigMock = (sampleIds) => ({
  cellSizeDistribution: {
    enabled: true,
    ...sampleifiedConfig(sampleIds, {
      auto: true,
      filterSettings: {
        minCellSize: 10800,
        binStep: 200,
      },
    }),
  },
  mitochondrialContent: {
    enabled: true,
    ...sampleifiedConfig(sampleIds, {
      auto: true,
      filterSettings: {
        method: 'absolute_threshold',
        methodSettings: {
          absolute_threshold: {
            maxFraction: 0.1,
            binStep: 200,
          },
        },
      },
    }),
  },
  classifier: {
    enabled: true,
    ...sampleifiedConfig(sampleIds, {
      auto: true,
      filterSettings: {
        FDR: 0.1,
      },
    }),
  },
  numGenesVsNumUmis: {
    enabled: true,
    ...sampleifiedConfig(sampleIds, {
      auto: true,
      filterSettings: {
        regressionType: 'gam',
        regressionTypeSettings: {
          gam: {
            'p.level': 0.00009,
          },
        },
      },
    }),
  },
  doubletScores: {
    enabled: true,
    ...sampleifiedConfig(sampleIds, {
      auto: true,
      filterSettings: {
        probabilityThreshold: 0.2,
        binStep: 0.05,
      },
    }),
  },
  dataIntegration: {
    enabled: true,
    dataIntegration: {
      method: 'seuratv4',
      methodSettings: {
        seuratv4: {
          numGenes: 2000,
          normalisation: 'logNormalize',
        },
        fastmnn: {
          numGenes: 2000,
          normalisation: 'logNormalize',
        },
        unisample: {
          numGenes: 2000,
          normalisation: 'logNormalize',
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
    enabled: true,
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
});

const generateExperimentSettingsMock = (sampleIds) => ({
  ...initialState,
  processing: {
    ...initialState.processing,
    ...generateProcessingConfigMock(sampleIds),
  },
});

export default generateExperimentSettingsMock;

export { initialPipelineState, initialWorkerState };
