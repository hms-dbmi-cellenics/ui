import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const EM = 16; // px
const CELLINFO_WIDTH = 200; // px
const CELLINFO_Y_PADDING = 6 * EM;
const Y_PADDING = 2 * EM;

const cellInfoStyle = { fontSize: '0.75rem' };

const CellInfo = (props) => {
  const {
    containerWidth, containerHeight, coordinates, cellInfo,
  } = props;

  const numTextRows = (cellInfo.cellSets?.length || 0) + 2;

  const invertX = () => coordinates.x + CELLINFO_WIDTH > containerWidth;
  const invertY = () => coordinates.y + (numTextRows * EM) + CELLINFO_Y_PADDING > containerHeight;

  const left = invertX() ? coordinates.x - (CELLINFO_WIDTH + EM) : coordinates.x + EM;
  const top = invertY() ? coordinates.y - (numTextRows * EM + Y_PADDING) : coordinates.y + EM;

  return (
    <Card
      size='small'
      style={{
        width: CELLINFO_WIDTH,
        zIndex: 6,
        border: 0,
        position: 'absolute',
        left,
        top,
        pointerEvents: 'none',
      }}
    >
      <div style={cellInfoStyle}>
        {`Cell id: ${cellInfo.cellId}`}
      </div>
      {cellInfo.geneName ? (
        <div style={cellInfoStyle}>
          {`Gene name: ${cellInfo.geneName}`}
        </div>
      ) : <></>}
      {cellInfo.expression !== undefined ? (
        <div style={cellInfoStyle}>
          Expression Level:&nbsp;
          {parseFloat(cellInfo.expression.toFixed(3))}
        </div>
      ) : <></>}
      {cellInfo.cellSets?.length > 0 ? cellInfo.cellSets.map((cellSetName) => (
        <div style={cellInfoStyle}>
          {cellSetName}
        </div>
      )) : <></>}
    </Card>
  );
};

CellInfo.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  coordinates: PropTypes.object.isRequired,
  cellInfo: PropTypes.object.isRequired,
};

export default CellInfo;
