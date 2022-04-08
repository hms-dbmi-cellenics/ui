import React from 'react';
import {
  useSelector,
} from 'react-redux';
import PropTypes from 'prop-types';

const CrossHair = (props) => {
  const { coordinates } = props;

  const cellInfo = useSelector((state) => state.cellInfo);

  const crosshairWidth = 1;

  const commonStyle = {
    position: 'absolute',
    backgroundColor: 'gray',
  };

  if (cellInfo.cellId && coordinates.x && coordinates.y) {
    return (
      <div>
        <div style={{
          ...commonStyle,
          top: 0,
          width: '1px',
          left: `${coordinates.x - crosshairWidth / 2}px`,
          height: `${coordinates.height}px`,
        }}
        />
        <div style={{
          ...commonStyle,
          left: 0,
          height: '1px',
          top: `${coordinates.y - crosshairWidth / 2}px`,
          width: `${coordinates.width}px`,
        }}
        />
      </div>
    );
  }
  return (<></>);
};

CrossHair.defaultProps = {};

CrossHair.propTypes = {
  coordinates: PropTypes.object.isRequired,
};

export default CrossHair;
