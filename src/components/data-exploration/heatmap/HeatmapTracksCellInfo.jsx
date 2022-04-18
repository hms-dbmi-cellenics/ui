import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const EM = 16; // px

const HeatmapTracksCellInfo = (props) => {
  const {
    width, cellId, trackName, coordinates, invertX,
  } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const left = invertX ? coordinates.x - (width + EM) : coordinates.x + EM;

  const renderCellInfo = () => (
    <Card
      size='small'
      style={{
        zIndex: 6,
        border: 0,
        width,
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
  width: 200,
  invertX: false,
};

HeatmapTracksCellInfo.propTypes = {
  width: PropTypes.number,
  invertX: PropTypes.bool,
  cellId: PropTypes.string.isRequired,
  coordinates: PropTypes.object.isRequired,
  trackName: PropTypes.string,
};

export default HeatmapTracksCellInfo;
