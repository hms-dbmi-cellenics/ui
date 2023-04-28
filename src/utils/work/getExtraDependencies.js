import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSetsHierarchy, getCellSetsHierarchyByKeys } from 'redux/selectors';
import workerVersions from 'utils/work/workerVersions';

const getClusteringSettings = async (experimentId, body, dispatch, getState) => {
  let clusteringSettings = getState().experimentSettings
    .processing.configureEmbedding?.clusteringSettings;

  if (!clusteringSettings) {
    await dispatch(loadProcessingSettings(experimentId));

    clusteringSettings = getState().experimentSettings
      .processing.configureEmbedding?.clusteringSettings;
  }

  return clusteringSettings;
};

// Check that the cell sets within the selected cellSetKey didn't change
// e.g., if cell set was deleted we can't use cache
const getSelectedCellSet = async (experimentId, body, dispatch, getState) => {
  await dispatch(loadCellSets(experimentId));

  const children = getCellSetsHierarchyByKeys([body.cellSetKey])(getState());
  const cellSetsKeys = children.map((cellSet) => cellSet.key);

  return cellSetsKeys;
};

const getCellSets = async (experimentId, body, dispatch, getState) => {
  await dispatch(loadCellSets(experimentId));

  const hierarchy = getCellSetsHierarchy()(getState());

  return hierarchy;
};

const dependencyGetters = {
  ClusterCells: [],
  ScTypeAnnotate: [],
  GetExpressionCellSets: [],
  GetEmbedding: [],
  ListGenes: [],
  DifferentialExpression: [getClusteringSettings],
  GeneExpression: [],
  GetBackgroundExpressedGenes: [getClusteringSettings],
  DotPlot: [getClusteringSettings],
  GetDoubletScore: [],
  GetMitochondrialContent: [],
  GetNGenes: [],
  GetNUmis: [],
  MarkerHeatmap: [getClusteringSettings, getSelectedCellSet],
  GetTrajectoryAnalysisStartingNodes: [getClusteringSettings],
  GetTrajectoryAnalysisPseudoTime: [getClusteringSettings],
  GetNormalizedExpression: [getClusteringSettings],
  DownloadAnnotSeuratObject: [getClusteringSettings, getCellSets],
};

const getExtraDependencies = async (experimentId, body, dispatch, getState) => {
  const { name } = body;

  const dependencies = await Promise.all(
    dependencyGetters[name].map(
      (dependencyGetter) => dependencyGetter(experimentId, body, dispatch, getState),
    ),
  );

  if (workerVersions[name]) {
    dependencies.push(workerVersions[name]);
  }

  return dependencies;
};

export default getExtraDependencies;
