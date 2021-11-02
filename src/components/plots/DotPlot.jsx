import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Vega } from 'react-vega';
import { generateSpec } from 'utils/plotSpecs/generateDotPlotSpec';
import { getCellSets, getCellSetsHierarchyByKey } from 'redux/selectors';

import PlatformError from 'components/PlatformError';
import { fastLoad } from 'components/Loader';

const DotPlot = (props) => {
  const { config, plotData } = props;

  const { loading: cellSetsLoading, error: cellSetsError } = useSelector(getCellSets());
  const cellSet = useSelector(getCellSetsHierarchyByKey([config.selectedCellSet]))[0];
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
