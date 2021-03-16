import React from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';

import Loader from '../Loader';

const getMiniaturizedConfig = (config) => {
  const miniatureConfig = {
    legend: {
      enabled: false,
    },
    axes: {
      titleFontSize: 5,
      labelFontSize: 5,
    },
    dimensions: {
      width: 120,
      height: 120,
    },
    title: {},
    marker: {
      size: 1,
    },
  };

  const miniPlotConfig = _.cloneDeep(config);
  _.assign(miniPlotConfig, miniatureConfig);

  if (miniPlotConfig.signals) { miniPlotConfig.signals[0].bind = undefined; }

  return miniPlotConfig;
};

const MiniPlot = (props) => {
  const {
    experimentId, plotUuid, plotFn, actions,
  } = props;

  const config = useSelector(
    (state) => state.componentConfig[plotUuid]?.config,
  );

  const plotData = useSelector(
    (state) => state.componentConfig[plotUuid]?.plotData,
  );

  console.log(plotUuid);

  const renderPlot = () => {
    // Spinner for main window
    if (!config) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return plotFn(getMiniaturizedConfig(config), plotData, actions);
  };

  return (
    renderPlot()
  );
};

MiniPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotFn: PropTypes.object.isRequired,
  actions: PropTypes.bool.isRequired,
};

export default MiniPlot;
