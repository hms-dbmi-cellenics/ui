import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

const VegaHeatmap = (props) => {
  const {
    spec, showAxes, rowsNumber, defaultWidth, signalListeners, data,
  } = props;

  const axes = [
    {
      domain: false,
      orient: 'left',
      scale: 'y',
    },
  ];

  const getAdjustedHeight = () => {
    const maxHeight = 400;
    const minHeightPerGene = 6;
    const heightPerGene = 30 - rowsNumber / 2;
    if (heightPerGene < minHeightPerGene || heightPerGene * rowsNumber > maxHeight) {
      return maxHeight;
    }
    return heightPerGene * rowsNumber;
  };

  const getAdjustedWidth = () => {
    if (showAxes) {
      return defaultWidth - 150;
    }
    return defaultWidth - 90;
  };

  const getAxes = () => {
    if (showAxes) {
      return axes;
    }
    return [];
  };

  spec.height = getAdjustedHeight();
  spec.width = getAdjustedWidth();
  spec.axes = getAxes();

  spec.data.forEach((datum) => {
    // eslint-disable-next-line no-param-reassign
    datum.values = data[datum.name];
  });

  return (
    <Vega
      spec={spec}
      signalListeners={signalListeners}
      actions={false}
    />
  );
};

VegaHeatmap.defaultProps = {
  showAxes: true,
};

VegaHeatmap.propTypes = {
  spec: PropTypes.object.isRequired,
  showAxes: PropTypes.bool,
  rowsNumber: PropTypes.number.isRequired,
  data: PropTypes.object.isRequired,
  defaultWidth: PropTypes.number.isRequired,
  signalListeners: PropTypes.object.isRequired,
};

export default VegaHeatmap;
