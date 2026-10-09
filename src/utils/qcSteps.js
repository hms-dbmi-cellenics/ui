import { sampleTech } from 'utils/constants';

// canonical ordering of QC steps.
// Single-cell and spatial filters never run together — the data processing page
// shows only the steps the dataset's technology runs (getQcStepsForTechnology).
const qcSteps = [
  'classifier',
  'cellSizeDistribution',
  'mitochondrialContent',
  'numGenesVsNumUmis',
  'doubletScores',
  'spatialCountDensity',
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
    case 'spatialCountDensity':
      return 'Count density filter';
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

const singleCellFilterSteps = [
  'classifier',
  'cellSizeDistribution',
  'mitochondrialContent',
  'numGenesVsNumUmis',
  'doubletScores',
];

// the spatial filters each spatial technology runs (matching the pipeline and
// API QC skeletons); Xenium panels have no mitochondrial genes
const spatialFilterStepsByTechnology = {
  [sampleTech.VISIUM_HD]: ['spatialUmiOutlier', 'spatialNumGenesOutlier', 'spatialMitoOutlier'],
  [sampleTech.XENIUM]: ['spatialCountDensity', 'spatialUmiOutlier', 'spatialNumGenesOutlier'],
};

// The QC steps a technology runs, in canonical order. Data integration and
// embedding run for every technology.
const getQcStepsForTechnology = (technology) => {
  const spatialFilterSteps = spatialFilterStepsByTechnology[technology];

  return qcSteps.filter((step) => {
    if (singleCellFilterSteps.includes(step)) return !spatialFilterSteps;
    if (step.startsWith('spatial')) return Boolean(spatialFilterSteps?.includes(step));
    return true;
  });
};

export {
  qcSteps,
  getUserFriendlyQCStepName,
  getQcStepsForTechnology,
};
