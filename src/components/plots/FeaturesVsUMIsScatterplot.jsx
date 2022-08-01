import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import generateSpec from 'utils/plotSpecs/generateFeaturesVsUMIsScatterplot';
import EmptyPlot from './helpers/EmptyPlot';
import transformOldFeaturesVsUMIsPlotData from './helpers/transformOldFeaturesVsUMIsPlotData';

const FeaturesVsUMIsScatterplot = (props) => {
  const {
    config, plotData, actions, expConfig,
  } = props;

  // we can remove this if we migrate old plotData to the new schema
  const needTransformPlotData = Array.isArray(plotData) && plotData.length;

  const newPlotData = needTransformPlotData
    ? transformOldFeaturesVsUMIsPlotData(plotData)
    : plotData;

  const [plotSpec, setPlotSpec] = useState(config);
  const { predictionInterval } = expConfig;
  useEffect(() => {
    if (config && newPlotData?.pointsData?.length) {
      setPlotSpec(generateSpec(config, newPlotData, expConfig));
    }
  }, [config, plotData, predictionInterval]);

  if (!newPlotData?.pointsData?.length) {
    return (
      <EmptyPlot mini={config.miniPlot} />
    );
  }

  return (
    <center data-testid='vega-container'>
      <Vega spec={plotSpec} renderer='canvas' actions={actions} />
    </center>
  );
};

FeaturesVsUMIsScatterplot.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
  ]),
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  expConfig: PropTypes.object.isRequired,
};

FeaturesVsUMIsScatterplot.defaultProps = {
  plotData: [],
  actions: true,
};

export default FeaturesVsUMIsScatterplot;
