import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import generateSpec from 'utils/plotSpecs/generateCellSizeDistributionKneePlot';
import EmptyPlot from './helpers/EmptyPlot';

const CellSizeDistributionKneePlot = (props) => {
  const {
    config, plotData, actions,
  } = props;
  const plotSpec = generateSpec(config, plotData);

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

CellSizeDistributionKneePlot.propTypes = {
  config: PropTypes.object.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

CellSizeDistributionKneePlot.defaultProps = {
  plotData: null,
  actions: true,
};

export default CellSizeDistributionKneePlot;
