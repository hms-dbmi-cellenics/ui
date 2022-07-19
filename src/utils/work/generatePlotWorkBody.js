const plotBodyWorkTypes = {
  DOT_PLOT_DATA: 'DotPlotDataWork',
  TRAJECTORY_ANALYSIS_ROOT_NODES: 'TrajectoryAnalysisRootNodesWork',
};

const composeDotPlotDataWorkBody = (config) => {
  const [filterGroup, filterKey] = config.selectedPoints.split('/');

  return {
    name: 'DotPlot',
    useMarkerGenes: config.useMarkerGenes,
    numberOfMarkers: config.nMarkerGenes,
    customGenesList: config.selectedGenes,
    groupBy: config.selectedCellSet,
    filterBy: {
      group: filterGroup,
      key: filterKey || 'All',
    },
    // clusterNames is used for triggering a work request upon cluster name change
    clusterNames: config.clusterNames,
  };
};

const composeTrajectoryAnalaysisRootNodesWorkBody = () => ({
  name: 'GetTrajectoryGraph',
  embeddingEtag: null, // TODO: Get ETag from embedding
});

const generatePlotWorkBody = (plotBodyWorkType, config) => {
  switch (plotBodyWorkType) {
    case plotBodyWorkTypes.DOT_PLOT_DATA:
      return composeDotPlotDataWorkBody(config);
    case plotBodyWorkTypes.TRAJECTORY_ANALYSIS_ROOT_NODES:
      return composeTrajectoryAnalaysisRootNodesWorkBody(config);
    default: {
      throw new Error('Work type doesn\'t exist');
    }
  }
};

export default generatePlotWorkBody;
export { plotBodyWorkTypes };
