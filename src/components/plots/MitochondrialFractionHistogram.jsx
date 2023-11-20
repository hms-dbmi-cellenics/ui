import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import generateSpec from 'utils/plotSpecs/generateMitochondrialFractionHistogram';
import EmptyPlot from './helpers/EmptyPlot';

const MitochondrialFractionHistogram = (props) => {
  const {
    config, plotData, actions,
  } = props;

  const plotSpec = generateSpec(config, plotData);

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
