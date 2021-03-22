import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateClassifierEmptyDropsPlot';

const ClassifierEmptyDropsPlot = (props) => {
  const {
    config, plotData, actions,
  } = props;

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    setPlotSpec(generateSpec(config, plotData));
  }, [config, plotData]);

  const render = () => {
    if (!plotData.length) {
      return (
        <PlatformError
          description='There is no data to display. Please run the filter again.'
          actionable={false}
          reason={' '}
        />
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
