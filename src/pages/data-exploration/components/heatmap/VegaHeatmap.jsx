import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { useDispatch } from 'react-redux';
import { updateCellInfo } from '../../../../redux/actions';

const VegaHeatmap = (props) => {
  const {
    spec, showAxes, rowsNumber, defaultWidth,
  } = props;
  const dispatch = useDispatch();
  const axes = [
    {
      domain: false,
      orient: 'left',
      scale: 'y',
    },
  ];

  const handleHover = (...args) => {
    if (args[1].datum) {
      const { cellName, expression, geneName } = args[1].datum;
      dispatch(updateCellInfo({ cellName, expression, geneName }));
    }
  };

  const signalListeners = {
    mouseover: handleHover,
  };

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
  defaultWidth: PropTypes.number.isRequired,
};

export default VegaHeatmap;
