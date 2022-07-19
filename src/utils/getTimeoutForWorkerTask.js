import getNumberOfCellsInGrouping from 'redux/selectors/getNumberOfCellsInGrouping';
import { plotTypes } from './constants';

// Timeouts calculated in https://docs.google.com/document/d/1vim9t9lWMLW8wALeJvDeYnofQa9tj9zPU3i1SOfMilM/edit
const getTimeoutForWorkerTaskUncapped = (state, taskName, options) => {
  // Get filtered nCells for more accurate timeout//
  // if louvain is not calculated (unlikely) get all nCells
  const nCells = getNumberOfCellsInGrouping('louvain', state) ?? getNumberOfCellsInGrouping('sample', state);

  switch (taskName) {
    case 'GetEmbedding': {
      const { type } = options;

      // Tsne is slower than tsne, so we give a bigger timeout to tsne
      if (type === 'umap') return 0.002 * nCells + 60;
      if (type === 'tsne') return 0.02 * nCells + 60;

      throw new Error('GetEmbedding type isn\'t specified');
    }
    case 'ClusterCells':
    case 'MarkerHeatmap': {
      return 0.002 * nCells + 60;
    }
    case 'DifferentialExpression':
    case plotTypes.TRAJECTORY_ANALYSIS: {
      return 180;
    }
    case 'ListGenes':
    case 'GeneExpression':
    case 'GetMitochondrialContent':
    case 'GetDoubletScore':
    case plotTypes.DOT_PLOT: {
      return 60;
    }
    default: {
      throw new Error('Task doesn\'t exist');
    }
  }
};

const getTimeoutForWorkerTask = (state, taskName, options) => (
  Math.max(getTimeoutForWorkerTaskUncapped(state, taskName, options), 60)
);

export default getTimeoutForWorkerTask;
