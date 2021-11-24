import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const HeatmapTracksCellInfo = (props) => {
  const {
    cellId, trackName, coordinates,
  } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const renderCellInfo = () => (
    <Card
      size='small'
      style={{
        zIndex: 6,
        border: 0,
        position: 'absolute',
        left: `${coordinates.x + 20}px`,
        top: `${coordinates.y + 20}px`,
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

  if (cellId && Object.keys(coordinates).length > 0) {
    return renderCellInfo();
  }

  return (<></>);
};

HeatmapTracksCellInfo.defaultProps = {};

HeatmapTracksCellInfo.propTypes = {
  cellId: PropTypes.string.isRequired,
  trackName: PropTypes.string.isRequired,
  coordinates: PropTypes.object.isRequired,
};

export default HeatmapTracksCellInfo;
