import React, { useState, useCallback } from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';
import getCellInfoCoordinates from 'utils/data-exploration/getCellInfoCoordinates';

const cellInfoStyle = { fontSize: '0.75rem' };

const HeatmapTracksCellInfo = (props) => {
  const {
    containerWidth, containerHeight, cellId, trackName, coordinates,
  } = props;

  const [tooltipEl, setTooltipEl] = useState(null);

  const getTooltipElement = useCallback((el) => {
    if (el) setTooltipEl(el?.firstChild);
  }, []);

  const { left } = getCellInfoCoordinates(
    coordinates,
    tooltipEl,
    containerWidth,
    containerHeight,
  );

  const renderCellInfo = () => (
    // We have to wrap the <Card> in a <div> because Antd does not correctly set the ref
    // https://github.com/ant-design/ant-design/issues/28582
    <div ref={getTooltipElement}>
      <Card
        size='small'
        style={{
          zIndex: 6,
          border: 0,
          position: 'absolute',
          left,
          top: '20px',
          pointerEvents: 'none',
        }}
      >
        {cellId ? (
          <div style={cellInfoStyle}>
            {`Cell id: ${cellId}`}
          </div>
        ) : <></>}
        {trackName ? (
          <div style={cellInfoStyle}>
            {`Group name: ${trackName}`}
          </div>
        ) : <></>}
      </Card>
    </div>
  );

  if (cellId) {
    return renderCellInfo();
  }

  return (<></>);
};

HeatmapTracksCellInfo.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  cellId: PropTypes.string.isRequired,
  coordinates: PropTypes.object.isRequired,
  trackName: PropTypes.string.isRequired,
};

export default HeatmapTracksCellInfo;
