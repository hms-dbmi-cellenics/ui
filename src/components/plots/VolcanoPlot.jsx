import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { generateSpec } from 'utils/plotSpecs/generateVolcanoSpec';

const VolcanoPlot = (props) => {
  const { plotData, config } = props;

  return (
    <Vega data={{ data: plotData }} spec={generateSpec(config)} renderer='canvas' />
  );
};

VolcanoPlot.defaultProps = {
  plotData: [],
  config: null,
};

VolcanoPlot.propTypes = {
  plotData: PropTypes.array,
  config: PropTypes.object,
};

export default VolcanoPlot;
