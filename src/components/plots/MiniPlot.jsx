import React from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { Skeleton } from 'antd';

const getMiniaturizedConfig = (config) => {
  const miniatureConfig = {
    legend: {
      enabled: false,
    },
    axes: {
      titleFontSize: 1,
      labelFontSize: 1,
    },
    dimensions: {
      width: 92,
      height: 92,
    },
    title: {},
    marker: {
      size: 1,
    },
    labels: {
      enabled: false,
    },
  };

  const miniPlotConfig = _.cloneDeep(config);
  _.assign(miniPlotConfig, miniatureConfig);

  if (miniPlotConfig.signals) { miniPlotConfig.signals[0].bind = undefined; }

  miniPlotConfig.miniPlot = true;

  return miniPlotConfig;
};

const MiniPlot = (props) => {
  const {
    plotUuid, dataPlotUuid, plotFn, actions,
  } = props;

  const { config } = useSelector(
    (state) => state.componentConfig[plotUuid] || {},
  );
  // plotData may live under a different uuid than the config (see PlotLayout)
  const { plotData } = useSelector(
    (state) => state.componentConfig[dataPlotUuid || plotUuid] || {},
  );

  const renderPlot = () => {
    if (!config) {
      return (
        <center>
          <Skeleton.Image style={{ width: 92, height: 92 }} />
        </center>
      );
    }

    return plotFn(getMiniaturizedConfig(config), plotData || [], actions);
  };

  return (
    renderPlot()
  );
};

MiniPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  dataPlotUuid: PropTypes.string,
  plotFn: PropTypes.func.isRequired,
  actions: PropTypes.bool.isRequired,
};

MiniPlot.defaultProps = {
  dataPlotUuid: null,
};

export default React.memo(MiniPlot);
