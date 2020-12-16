import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { Element } from 'react-scroll';
import './Heatmap.module.css';

const VegaHeatmap = (props) => {
  const {
    spec, showAxes, rowsNumber, signalListeners, data, width, height,
  } = props;

  const axes = [
    {
      domain: false,
      orient: 'left',
      scale: 'y',
    },
  ];

  const getAdjustedHeight = () => {
    const minHeightPerGene = 6;
    const heightPerGene = 30 - rowsNumber / 2;
    if (heightPerGene < minHeightPerGene || heightPerGene * rowsNumber > height) {
      return height;
    }
    return heightPerGene * rowsNumber;
  };

  const getAxes = () => {
    if (showAxes) {
      return axes;
    }
    return [];
  };

  const vegaSpec = {
    ...spec,
    width: width * 0.98,
    height: getAdjustedHeight() * 0.9,
    autosize: { type: 'fit' },
    axes: [...spec.axes, ...getAxes()],
    data: spec.data.map((datum) => ({
      ...datum,
      values: data[datum.name],
    })),
  };

  return (
    <Element
      className='element'
      id='heatmap-container'
    >
      <Vega
        spec={vegaSpec}
        signalListeners={signalListeners}
        actions={false}
        onNewView={(e) => console.log(e)}
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
