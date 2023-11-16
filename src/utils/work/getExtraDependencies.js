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

// Check that the cell sets within the selected selectedCellSet didn't change
// e.g., if cell set was deleted we can't use cache
const getCellSetsThatAffectDownsampling = async (experimentId, body, dispatch, getState) => {
  // If not downsampling, then there's no dependency set by this getter
  if (!body.downsampleSettings) return '';

  const { downsampleSettings: { groupedTracks, selectedCellSet } } = body;

  await dispatch(loadCellSets(experimentId));

  const [{ children }] = getCellSetsHierarchyByKeys([selectedCellSet])(getState());

  const selectedCellSetKeys = children.map((cellSet) => cellSet.key);

  const groupedCellSetKeys = getCellSetsHierarchy(groupedTracks)(getState())
    .map((cellClass) => cellClass.children)
    .flat()
    .map(({ key }) => key);

  // Keep them in separate lists, they each represent different changes in the settings
  return [selectedCellSetKeys, groupedCellSetKeys];
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
  BatchDifferentialExpression: [getClusteringSettings],
  GeneExpression: [getClusteringSettings, getCellSetsThatAffectDownsampling],
  GetBackgroundExpressedGenes: [getClusteringSettings],
  DotPlot: [getClusteringSettings],
  GetDoubletScore: [],
  GetMitochondrialContent: [],
  GetNGenes: [],
  GetNUmis: [],
  MarkerHeatmap: [getClusteringSettings, getCellSetsThatAffectDownsampling],
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
