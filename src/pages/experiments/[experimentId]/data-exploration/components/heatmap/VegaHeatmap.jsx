import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { Element } from 'react-scroll';
import './Heatmap.module.css';

const VegaHeatmap = (props) => {
  const {
    spec, showAxes, rowsNumber, defaultWidth, signalListeners, data, width, height,
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

  const vegaSpec = {
    ...spec,
    height: getAdjustedHeight(),
    width: getAdjustedWidth(),
    axes: getAxes(),
    data: spec.data.map((datum) => ({
      ...datum,
      values: data[datum.name],
    })),
  };

  return (
    <Element
      className='element'
      id='heatmap-container'
      style={{
        position: 'relative',
        height: `${height - 40}px`,
        width: `${width - 8}px`,
        overflow: 'scroll',
      }}
    >
      <Vega
        spec={vegaSpec}
        signalListeners={signalListeners}
        actions={false}
      />
    </Element>
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
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default VegaHeatmap;
