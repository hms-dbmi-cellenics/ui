// canonical ordering of QC steps.
// Single-cell and spatial (Visium HD) filters never run together — the data
// processing page shows only the set matching the dataset's technology.
const qcSteps = [
  'classifier',
  'cellSizeDistribution',
  'mitochondrialContent',
  'numGenesVsNumUmis',
  'doubletScores',
  'spatialUmiOutlier',
  'spatialNumGenesOutlier',
  'spatialMitoOutlier',
  'dataIntegration',
  'configureEmbedding',
];

const getUserFriendlyQCStepName = (step) => {
  switch (step) {
    case 'classifier':
      return 'Classifier filter';
    case 'cellSizeDistribution':
      return 'Cell size distribution filter';
    case 'mitochondrialContent':
      return 'Mitochondrial content filter';
    case 'numGenesVsNumUmis':
      return 'Number of genes vs UMIs filter';
    case 'doubletScores':
      return 'Doublet filter';
    case 'spatialUmiOutlier':
      return 'UMI filter';
    case 'spatialNumGenesOutlier':
      return 'Number of genes filter';
    case 'spatialMitoOutlier':
      return 'Mitochondrial content filter';
    case 'dataIntegration':
      return 'Data integration';
    case 'configureEmbedding':
      return 'Configure embedding';
    default:
      throw new Error('Step does not exist');
  }
};

export {
  qcSteps,
  getUserFriendlyQCStepName,
};
