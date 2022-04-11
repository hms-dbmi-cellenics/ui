import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import EmptyPlot from './helpers/EmptyPlot';
import generateSpec from '../../utils/plotSpecs/generateClassifierKneePlot';

const ClassifierKneePlot = (props) => {
  const {
    config, expConfig, plotData, actions,
  } = props;

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    if (config && plotData) {
      setPlotSpec(generateSpec(config, expConfig, plotData));
    }
  }, [config, expConfig, plotData]);

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

ClassifierKneePlot.propTypes = {
  config: PropTypes.object.isRequired,
  expConfig: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

ClassifierKneePlot.defaultProps = {
  plotData: null,
  actions: true,
};

export default ClassifierKneePlot;
