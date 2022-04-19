import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const EM = 16; // px
const Y_PADDING = 2 * EM;
const TOOLTIP_WIDTH = 200; // px
const TOOLTIP_Y_PADDING = 6 * EM;

const cellInfoStyle = { fontSize: '0.75rem' };

const HeatmapCellInfo = (props) => {
  const {
    containerWidth, containerHeight, cellId, geneName, geneExpression, coordinates,
  } = props;

  const invertX = () => coordinates.x + TOOLTIP_WIDTH > containerWidth;
  const invertY = () => coordinates.y + (3 * EM) + TOOLTIP_Y_PADDING > containerHeight;

  const left = invertX() ? coordinates.x - (TOOLTIP_WIDTH + EM) : coordinates.x + EM;
  const top = invertY() ? coordinates.y - (3 * EM + Y_PADDING) : coordinates.y + EM;

  const renderCellInfo = () => (
    <Card
      size='small'
      style={{
        zIndex: 6,
        border: 0,
        width: TOOLTIP_WIDTH,
        position: 'absolute',
        left,
        top,
        pointerEvents: 'none',
      }}
    >
      {cellId ? (
        <div style={cellInfoStyle}>
          {`Cell id: ${cellId}`}
        </div>
      ) : <></>}
      {geneName ? (
        <div style={cellInfoStyle}>
          {`Gene name: ${geneName}`}
        </div>
      ) : <></>}
      {geneExpression !== undefined ? (
        <div style={cellInfoStyle}>
          Expression:&nbsp;
          {geneExpression}
        </div>
      ) : <></>}
    </Card>
  );

  if (cellId) {
    return renderCellInfo();
  }

  return (<></>);
};

HeatmapCellInfo.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  cellId: PropTypes.string.isRequired,
  geneName: PropTypes.string.isRequired,
  geneExpression: PropTypes.number.isRequired,
  coordinates: PropTypes.object.isRequired,
};

export default HeatmapCellInfo;
