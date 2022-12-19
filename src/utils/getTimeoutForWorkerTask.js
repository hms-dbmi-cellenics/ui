import getNumberOfCellsInGrouping from 'redux/selectors/getNumberOfCellsInGrouping';
import { getCellSetsHierarchyByKeys } from 'redux/selectors';

// Timeouts calculated in https://docs.google.com/document/d/1vim9t9lWMLW8wALeJvDeYnofQa9tj9zPU3i1SOfMilM/edit
const getTimeoutForWorkerTaskUncapped = (state, taskName, options) => {
  // Get filtered nCells for more accurate timeout//
  // if louvain is not calculated (unlikely) get all nCells
  const nCells = getNumberOfCellsInGrouping('louvain', state) ?? getNumberOfCellsInGrouping('sample', state);
  const nClusters = getCellSetsHierarchyByKeys(['louvain'])(state)[0]?.children.length ?? 1;

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
    case 'DifferentialExpression': {
      return 180;
    }
    case 'TrajectoryAnalysisStartingNodes': {
      // Number of clusters is inversely proportional to running time
      // Larger custers produce more possible trajectories
      return ((0.3 * nCells) / nClusters) + 60;
    }
    case 'TrajectoryAnalysisPseudotime': {
      return ((0.6 * nCells) / nClusters) + 60;
    }
    case 'ListGenes':
    case 'GeneExpression':
    case 'GetMitochondrialContent':
    case 'GetDoubletScore':
    case 'GetNormalizedExpression':
    case 'GetNUmis':
    case 'GetNGenes':
    case 'PlotData': {
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
