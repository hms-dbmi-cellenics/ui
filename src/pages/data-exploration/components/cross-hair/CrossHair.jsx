import React, { useState, useEffect } from 'react';
import {
  useSelector,
} from 'react-redux';
import PropTypes from 'prop-types';

const CrossHair = (props) => {
  const { getView, componentType } = props;

  const selectedCell = useSelector((state) => state.cellInfo.cellName);
  const hoveredFrom = useSelector((state) => state.cellInfo.componentType);
  const [view, setView] = useState({});
  const [visible, setVisible] = useState(false);

  const crosshairWidth = 1;

  const getCoordinates = () => {
    const newView = getView();
    setView(newView);
  };

  useEffect(() => {
    if (!selectedCell) {
      return;
    }
    if (hoveredFrom !== componentType) {
      setVisible(true);
      getCoordinates();
    } else {
      setVisible(false);
    }
  }, [selectedCell]);


  if (visible && view) {
    return (
      <>
        <div style={{
          zIndex: 5,
          position: 'absolute',
          backgroundColor: 'gray',
          top: 0,
          width: '1px',
          left: `${view.x - crosshairWidth / 2}px`,
          height: `${view.height}px`,
        }}
        />
        {componentType !== 'heatmap' ? (
          <div style={{
            zIndex: 5,
            position: 'absolute',
            backgroundColor: 'gray',
            left: 0,
            height: '1px',
            top: `${view.y - crosshairWidth / 2}px`,
            width: `${view.width}px`,
          }}
          />
        ) : <></>}
      </>
    );
  }
  return (<></>);
};

CrossHair.defaultProps = {};

CrossHair.propTypes = {
  getView: PropTypes.func.isRequired,
  componentType: PropTypes.string.isRequired,
};

export default CrossHair;
