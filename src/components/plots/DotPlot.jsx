import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Vega } from 'react-vega';
import { generateSpec } from 'utils/plotSpecs/generateDotPlotSpec';
import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';

import PlatformError from 'components/PlatformError';
import { fastLoad } from 'components/Loader';

// Mock data, delete this once we have the real data
const generateMockData = (numGenes, numClusters) => {
  const mockPlotData = [];

  for (let gene = 0; gene < numGenes; gene += 1) {
    for (let cluster = 0; cluster < numClusters; cluster += 1) {
      mockPlotData.push({
        gene: `gene${gene}`,
        cluster: `cluster${cluster}`,
        AvgExpression: Math.random(),
        cellsFraction: Math.random(),
      });
    }
  }

  return mockPlotData;
};

const plotData = generateMockData(3, 14);

const DotPlot = (props) => {
  const { config } = props;

  const { loading: cellSetsLoading, error: cellSetsError } = useSelector(getCellSets());
  const cellSet = useSelector(getCellSetsHierarchyByKeys([config.selectedCellSet]))[0];
  const numClusters = cellSet ? cellSet.children.length : 0;

  const actions = {
    export: true,
    source: false,
    compiled: false,
    editor: false,
  };

  const render = () => {
    if (cellSetsError) {
      return (
        <PlatformError
          error={cellSetsError}
          reason={cellSetsError.message}
          onClick={() => {
            // This needs to be implemented when implementing the backend
            // reloadPlotData();
          }}
        />
      );
    }

    if (cellSetsLoading) {
      return (
        <center>
          {fastLoad()}
        </center>
      );
    }

    return <Vega spec={generateSpec(config, plotData, numClusters)} renderer='canvas' actions={actions} />;
  };

  return render();
};

DotPlot.propTypes = {
  config: PropTypes.object.isRequired,
};

export default DotPlot;
