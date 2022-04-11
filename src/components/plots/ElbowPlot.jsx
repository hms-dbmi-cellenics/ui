import React, { useState, useEffect } from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';
import EmptyPlot from './helpers/EmptyPlot';
import { generateSpec } from '../../utils/plotSpecs/generateElbowSpec';

const ElbowPlot = (props) => {
  const {
    config, plotData, actions, numPCs,
  } = props;

  const [plotSpec, setPlotSpec] = useState(null);

  useEffect(() => {
    if (config && plotData && numPCs) {
      setPlotSpec(generateSpec(config, plotData, numPCs));
    }
  }, [config, plotData, numPCs]);

  if (!plotSpec) {
    return (
      <EmptyPlot mini={config.miniPlot} />
    );
  }

  return (
    <center>
      <Vega data={{ plotData }} spec={plotSpec} renderer='canvas' actions={actions} />
    </center>
  );
};

ElbowPlot.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  numPCs: PropTypes.number,
};

ElbowPlot.defaultProps = {
  actions: true,
  plotData: [],
  numPCs: 30,
};

export default ElbowPlot;
