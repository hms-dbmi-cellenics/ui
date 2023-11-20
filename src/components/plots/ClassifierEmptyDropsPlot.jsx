import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import generateSpec from 'utils/plotSpecs/generateClassifierEmptyDropsPlot';
import EmptyPlot from './helpers/EmptyPlot';

const ClassifierEmptyDropsPlot = (props) => {
  const {
    config, expConfig, plotData, actions,
  } = props;

  const plotSpec = generateSpec(config, expConfig, plotData);

  if (!plotData.length) {
    return (
      <EmptyPlot mini={config.miniPlot} />
    );
  }

  return (
    <center>
      <Vega spec={plotSpec} renderer='canvas' actions={actions} />
    </center>
  );
};

ClassifierEmptyDropsPlot.propTypes = {
  config: PropTypes.object.isRequired,
  expConfig: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

ClassifierEmptyDropsPlot.defaultProps = {
  actions: true,
  plotData: null,
};

export default ClassifierEmptyDropsPlot;
