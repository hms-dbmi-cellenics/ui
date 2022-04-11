import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import EmptyPlot from './helpers/EmptyPlot';
import generateSpec from '../../utils/plotSpecs/generateClassifierEmptyDropsPlot';

const ClassifierEmptyDropsPlot = (props) => {
  const {
    config, expConfig, plotData, actions,
  } = props;

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    setPlotSpec(generateSpec(config, expConfig, plotData));
  }, [config, expConfig, plotData]);

  const render = () => {
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

  return (
    <>
      { render()}
    </>
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
