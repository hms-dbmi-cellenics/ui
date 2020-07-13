import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { useDispatch } from 'react-redux';
import ContainerDimensions from 'react-container-dimensions';
import { updateCellInfo } from '../../../../redux/actions';

const componentType = 'heatmap';

const VegaHeatmap = (props) => {
  const { spec, showAxes, rowsNumber } = props;
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
      dispatch(updateCellInfo({
        cellName, expression, geneName, componentType,
      }));
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


  return (
    <div>
      <ContainerDimensions>
        {({ width }) => {
          if (showAxes) {
            spec.axes = axes;
            spec.width = width - 100;
          } else {
            spec.axes = [];
            spec.width = width - 40;
          }
          spec.height = getAdjustedHeight();
          return (
            <Vega
              spec={spec}
              signalListeners={signalListeners}
              actions={false}
            />
          );
        }}
      </ContainerDimensions>
    </div>
  );
};

VegaHeatmap.defaultProps = {
  showAxes: true,
};

VegaHeatmap.propTypes = {
  spec: PropTypes.object.isRequired,
  showAxes: PropTypes.bool,
  rowsNumber: PropTypes.number.isRequired,
};

export default VegaHeatmap;
