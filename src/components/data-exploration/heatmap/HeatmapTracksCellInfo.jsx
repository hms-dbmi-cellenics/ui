import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const EM = 16; // px
const TOOLTIP_WIDTH = 200; // px
const cellInfoStyle = { fontSize: '0.75rem' };

const HeatmapTracksCellInfo = (props) => {
  const {
    containerWidth, cellId, trackName, coordinates,
  } = props;

  const invertX = () => coordinates.x + TOOLTIP_WIDTH > containerWidth;

  const left = invertX() ? coordinates.x - (TOOLTIP_WIDTH + EM) : coordinates.x + EM;

  const renderCellInfo = () => (
    <Card
      size='small'
      style={{
        zIndex: 6,
        border: 0,
        width: TOOLTIP_WIDTH,
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
  );

  if (cellId) {
    return renderCellInfo();
  }

  return (<></>);
};

HeatmapTracksCellInfo.defaultProps = {
  trackName: null,
};

HeatmapTracksCellInfo.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  cellId: PropTypes.string.isRequired,
  coordinates: PropTypes.object.isRequired,
  trackName: PropTypes.string,
};

export default HeatmapTracksCellInfo;
