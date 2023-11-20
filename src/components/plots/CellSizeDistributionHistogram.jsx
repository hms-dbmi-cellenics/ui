import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import generateSpec from 'utils/plotSpecs/generateCellSizeDistributionHistogram';
import EmptyPlot from './helpers/EmptyPlot';

const CellSizeDistributionHistogram = (props) => {
  const {
    config, plotData, actions, highestUmi,
  } = props;

  const plotSpec = generateSpec(config, plotData, highestUmi);

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
      {render()}
    </>
  );
};

CellSizeDistributionHistogram.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  highestUmi: PropTypes.number.isRequired,
};

CellSizeDistributionHistogram.defaultProps = {
  plotData: null,
  actions: true,
};

export default CellSizeDistributionHistogram;
