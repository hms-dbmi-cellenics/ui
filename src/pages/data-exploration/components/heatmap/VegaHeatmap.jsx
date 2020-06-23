import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { useDispatch } from 'react-redux';
import ContainerDimensions from 'react-container-dimensions';
import { updateCellInfo } from '../../../../redux/actions';

const VegaHeatmap = (props) => {
  const { spec, showAxes } = props;
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

  return (
    <div>
      <ContainerDimensions>
        {({ width, height }) => {
          spec.height = height + 300;
          if (showAxes) {
            spec.axes = axes;
            spec.width = width - 100;
          } else {
            spec.axes = [];
            spec.width = width - 40;
          }
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
};

export default VegaHeatmap;
