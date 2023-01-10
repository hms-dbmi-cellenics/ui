import getNumberOfCellsInGrouping from 'redux/selectors/getNumberOfCellsInGrouping';
import { getCellSetsHierarchyByKeys } from 'redux/selectors';

// Timeouts calculated in https://docs.google.com/document/d/1vim9t9lWMLW8wALeJvDeYnofQa9tj9zPU3i1SOfMilM/edit
const getTimeoutForWorkerTaskUncapped = (state, taskName) => {
  // Get filtered nCells for more accurate timeout//
  // if louvain is not calculated (unlikely) get all nCells
  const nCells = getNumberOfCellsInGrouping('louvain', state) ?? getNumberOfCellsInGrouping('sample', state);
  const nClusters = getCellSetsHierarchyByKeys(['louvain'])(state)[0]?.children.length ?? 1;

  console.log(`getTimeoutForWorkerTaskUncapped ${taskName}: nCells ${nCells}`);
  console.log(`getTimeoutForWorkerTaskUncapped ${taskName}: state `, state);
  const baseTimeout = 180; // some big datasets take up to 2-3 minutes to be downloaded & loaded

  switch (taskName) {
    case 'GetEmbedding':
    case 'ListGenes':
    case 'MarkerHeatmap': {
      // const { type } = options;

      // Tsne is slower than tsne, so we give a bigger timeout to tsne
      // if (type === 'umap') return 0.002 * nCells + baseTimeout;
      // we use tsne timeout only as it's the slowest and we can't know
      // which one was requested for ListGenes / MarkerHeatmap calls
      // const markerTimeout = 0.002 * nCells + baseTimeout;
      const tsneTimeout = 0.02 * nCells + baseTimeout;
      // we return the longest timeout because these calls can overlap
      console.log('tsneTimeout: ', tsneTimeout);
      return 900;
      // return tsneTimeout;
    }
    case 'ClusterCells': {
      return 0.002 * nCells + baseTimeout;
    }

    case 'TrajectoryAnalysisStartingNodes': {
      // Number of clusters is inversely proportional to running time
      // Larger custers produce more possible trajectories
      return ((0.3 * nCells) / nClusters) + baseTimeout;
    }
    case 'TrajectoryAnalysisPseudotime': {
      return ((0.6 * nCells) / nClusters) + baseTimeout;
    }
    case 'GeneExpression':
    case 'GetMitochondrialContent':
    case 'GetDoubletScore':
    case 'GetNormalizedExpression':
    case 'DifferentialExpression':
    case 'GetNUmis':
    case 'GetNGenes':
    case 'PlotData': {
      return baseTimeout;
    }
    default: {
      throw new Error('Task doesn\'t exist');
    }
  }
};

const getTimeoutForWorkerTask = (state, taskName) => (
  Math.max(getTimeoutForWorkerTaskUncapped(state, taskName), 60)
);

export default getTimeoutForWorkerTask;
