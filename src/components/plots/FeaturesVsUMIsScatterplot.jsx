import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import EmptyPlot from './helpers/EmptyPlot';
import transformOldFeaturesVsUMIsPlotData from './helpers/transformOldFeaturesVsUMIsPlotData';
import generateSpec from '../../utils/plotSpecs/generateFeaturesVsUMIsScatterplot';

const FeaturesVsUMIsScatterplot = (props) => {
  const {
    config, plotData, actions,
  } = props;

  // can remove if we formally migrate
  const newPlotData = (!Array.isArray(plotData) || !plotData.length)
    ? plotData
    : transformOldFeaturesVsUMIsPlotData(plotData);

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    if (config && newPlotData?.pointsData?.length) {
      setPlotSpec(generateSpec(config, newPlotData));
    }
  }, [config, plotData]);

  const render = () => {
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

  return (
    <>
      { render()}
    </>
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
};

FeaturesVsUMIsScatterplot.defaultProps = {
  plotData: null,
  actions: true,
};

export default FeaturesVsUMIsScatterplot;
