import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import EmptyPlot from './helpers/EmptyPlot';
import generateSpec from '../../utils/plotSpecs/generateMitochondrialFractionHistogram';

const MitochondrialFractionHistogram = (props) => {
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

MitochondrialFractionHistogram.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

MitochondrialFractionHistogram.defaultProps = {
  plotData: null,
  actions: true,
};

export default MitochondrialFractionHistogram;
