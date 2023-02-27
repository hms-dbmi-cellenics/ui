import getNumberOfCellsInGrouping from 'redux/selectors/getNumberOfCellsInGrouping';
import { getCellSetsHierarchyByKeys } from 'redux/selectors';

// Timeouts calculated in https://docs.google.com/document/d/1vim9t9lWMLW8wALeJvDeYnofQa9tj9zPU3i1SOfMilM/edit
const getTimeoutForWorkerTask = (state, taskName) => {
  // Get filtered nCells for more accurate timeout//
  // if louvain is not calculated (unlikely) get all nCells
  const nCells = getNumberOfCellsInGrouping('louvain', state) ?? getNumberOfCellsInGrouping('sample', state);
  const nClusters = getCellSetsHierarchyByKeys(['louvain'])(state)[0]?.children.length ?? 1;

  const baseTimeout = 180; // some big datasets take up to 2-3 minutes to be downloaded & loaded

  switch (taskName) {
    case 'GetEmbedding':
    case 'ListGenes':
    case 'MarkerHeatmap': {
      // all of this calls can happen at the same time and each of them can potentially have to
      // wait for the others to finish before it starts processing (due to the SQS) so the timeout
      // needs to be large enough for the slowest task to finish
      // the 900s (15min) is based on the time it takes to create the marker heatmap
      // for a 430k cells
      return 900;
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

export default getTimeoutForWorkerTask;
