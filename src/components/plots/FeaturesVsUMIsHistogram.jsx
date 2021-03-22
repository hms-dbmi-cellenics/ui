import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import generateSpec from '../../utils/plotSpecs/generateFeaturesVsUMIsHistogram';

const FeaturesVsUMIsHistogram = (props) => {
  const {
    config, plotData, actions,
  } = props;

  const [plotSpec, setPlotSpec] = useState(config);

  useEffect(() => {
    if (config && plotData) {
      setPlotSpec(generateSpec(config, plotData));
    }
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

FeaturesVsUMIsHistogram.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

FeaturesVsUMIsHistogram.defaultProps = {
  plotData: null,
  actions: true,
};

export default FeaturesVsUMIsHistogram;
