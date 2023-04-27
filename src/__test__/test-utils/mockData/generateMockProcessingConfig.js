import _ from 'lodash';

import fake from '__test__/test-utils/constants';

const baseProcessingConfig = {
  cellSizeDistribution: {},
  classifier: {},
  mitochondrialContent: {},
  numGenesVsNumUmis: {},
  doubletScores: {},
  dataIntegration: {
    dataIntegration: {
      method: 'harmony',
      methodSettings: {
        harmony: {
          numGenes: 2000,
          normalisation: 'logNormalize',
        },
        fastmnn: {
          numGenes: 2000,
          normalisation: 'logNormalize',
        },
        seuratv4: {
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
      excludeGeneCategories: [],
      numPCs: 30,
    },
  },
  configureEmbedding: {
    embeddingSettings: {
      method: 'umap',
      methodSettings: {
        tsne: {
          perplexity: 30,
          learningRate: 9550.167,
        },
        umap: {
          minimumDistance: 0.3,
          distanceMetric: 'cosine',
        },
      },
    },
    clusteringSettings: {
      method: 'louvain',
      methodSettings: {
        louvain: {
          resolution: 0.8,
        },
      },
    },
  },
};

const generateMockProcessingConfig = (numSamples = 3) => {
  const processingConfig = _.cloneDeep(baseProcessingConfig);

  _.times(numSamples, (idx) => {
    const newSampleId = `${fake.SAMPLE_ID}-${idx}`;

    processingConfig.cellSizeDistribution[newSampleId] = {
      filterSettings: {
        minCellSize: 359,
        binStep: 200,
      },
      defaultFilterSettings: {
        minCellSize: 359,
        binStep: 200,
      },
      auto: true,
      enabled: true,
    };
    processingConfig.classifier[newSampleId] = {
      filterSettings: {
        FDR: 0.01,
      },
      defaultFilterSettings: {
        FDR: 0.01,
      },
      prefiltered: false,
      auto: true,
      enabled: true,
    };
    processingConfig.doubletScores[newSampleId] = {
      filterSettings: {
        probabilityThreshold: 0.3877274,
        binStep: 0.05,
      },
      defaultFilterSettings: {
        probabilityThreshold: 0.3877274,
        binStep: 0.05,
      },
      auto: true,
      enabled: true,
    };
    processingConfig.mitochondrialContent[newSampleId] = {
      filterSettings: {
        method: 'absoluteThreshold',
        methodSettings: {
          absoluteThreshold: {
            maxFraction: 0.1,
            binStep: 0.05,
          },
        },
      },
      defaultFilterSettings: {
        method: 'absoluteThreshold',
        methodSettings: {
          absoluteThreshold: {
            maxFraction: 0.1,
            binStep: 0.05,
          },
        },
      },
      auto: true,
      enabled: true,
    };
    processingConfig.numGenesVsNumUmis[newSampleId] = {
      filterSettings: {
        regressionType: 'gam',
        regressionTypeSettings: {
          gam: {
            'p.level': 0.0001405679,
          },
        },
      },
      defaultFilterSettings: {
        regressionType: 'gam',
        regressionTypeSettings: {
          gam: {
            'p.level': 0.0001405679,
          },
        },
      },
      auto: true,
      enabled: true,
    };
  });

  return processingConfig;
};

export default generateMockProcessingConfig;
