import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { useDispatch } from 'react-redux';
import ContainerDimensions from 'react-container-dimensions';
import { updateCellInfo } from '../../../../redux/actions';

const VegaHeatmap = (props) => {
  const { spec } = props;
  const dispatch = useDispatch();

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
          spec.width = width - 40;
          spec.height = height + 300;
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

VegaHeatmap.propTypes = {
  spec: PropTypes.object.isRequired,
};

export default VegaHeatmap;
