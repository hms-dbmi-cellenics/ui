import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Vega } from 'react-vega';
import { generateSpec } from 'utils/plotSpecs/generateDotPlotSpec';
import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';
import Loader from 'components/Loader';

import PlatformError from 'components/PlatformError';
import { loadCellSets } from 'redux/actions/cellSets';

const DotPlot = (props) => {
  const { experimentId, config, plotData } = props;

  const { loading: cellSetsLoading, error: cellSetsError } = useSelector(getCellSets());
  const cellSet = useSelector(getCellSetsHierarchyByKeys([config.selectedCellSet]))[0];
  const numClusters = cellSet ? cellSet.children.length : 0;
  const data = useRef(plotData);

  useEffect(() => {
    if (data.current !== plotData) {
      data.current = plotData;
    }
  }, [plotData]);

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
          reason={cellSetsError}
          onClick={() => loadCellSets(experimentId)}
        />
      );
    }

    if (cellSetsLoading) return <Loader experimentId={experimentId} />;

    // PlotData has to be cloned for this plot because Immer freezes plotData meanwhile the plot needs to modify it to work
    return <Vega spec={generateSpec(config, data.current, numClusters)} renderer='canvas' actions={actions} />;
  };

  return render();
};

DotPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.array.isRequired,
};

DotPlot.defaultProps = {
  config: {},
};

export default DotPlot;
