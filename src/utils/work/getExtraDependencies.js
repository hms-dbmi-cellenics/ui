import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import workerVersions from 'utils/work/workerVersions';

const getClusteringSettings = async (experimentId, dispatch, getState) => {
  let clusteringSettings = getState().experimentSettings
    .processing.configureEmbedding?.clusteringSettings;

  if (!clusteringSettings) {
    await dispatch(loadProcessingSettings(experimentId));

    clusteringSettings = getState().experimentSettings
      .processing.configureEmbedding?.clusteringSettings;
  }

  return clusteringSettings;
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
  MarkerHeatmap: [getClusteringSettings],
  GetTrajectoryAnalysisStartingNodes: [getClusteringSettings],
  GetTrajectoryAnalysisPseudoTime: [getClusteringSettings],
  GetNormalizedExpression: [getClusteringSettings],
};

const getExtraDependencies = async (experimentId, name, dispatch, getState) => {
  const dependencies = await Promise.all(
    dependencyGetters[name].map(
      (dependencyGetter) => dependencyGetter(experimentId, dispatch, getState),
    ),
  );

  if (workerVersions[name]) {
    dependencies.push(workerVersions[name]);
  }

  return dependencies;
};

export default getExtraDependencies;
