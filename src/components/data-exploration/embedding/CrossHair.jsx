import React, { useState, useEffect } from 'react';
import {
  useSelector,
} from 'react-redux';
import PropTypes from 'prop-types';

const CrossHair = (props) => {
  const { coordinates } = props;

  const cellInfo = useSelector((state) => state.cellInfo);
  const [crossHairsVisible, setCrossHairsVisible] = useState(false);

  const crosshairWidth = 1;

  useEffect(() => {
    if (!cellInfo.cellId && crossHairsVisible) {
      setCrossHairsVisible(false);
      return;
    }
    if (cellInfo.cellId) {
      if (!crossHairsVisible) {
        setCrossHairsVisible(true);
      }
    }
  }, [cellInfo]);

  const commonStyle = {
    position: 'absolute',
    backgroundColor: 'gray',
    pointerEvents: 'none',
  };

  if (crossHairsVisible && Object.keys(coordinates.current).length > 0) {
    return (
      <div>
        <div style={{
          ...commonStyle,
          top: 0,
          width: '1px',
          left: `${coordinates.current.x - crosshairWidth / 2}px`,
          height: `${coordinates.current.height}px`,
        }}
        />
        <div style={{
          ...commonStyle,
          left: 0,
          height: '1px',
          top: `${coordinates.current.y - crosshairWidth / 2}px`,
          width: `${coordinates.current.width}px`,
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
