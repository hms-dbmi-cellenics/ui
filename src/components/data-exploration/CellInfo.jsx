import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const EM = 16; // px
const Y_PADDING = 5 * EM;

const CellInfo = (props) => {
  const {
    width, coordinates, cellInfo, invertX, invertY, numTextRows,
  } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const left = invertX ? coordinates.x - (width + EM) : coordinates.x + EM;
  const top = invertY ? coordinates.y - (numTextRows * EM + Y_PADDING) : coordinates.y + EM;

  return (
    <Card
      size='small'
      style={{
        width,
        zIndex: 6,
        border: 0,
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
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
  width: PropTypes.number,
  coordinates: PropTypes.object.isRequired,
  cellInfo: PropTypes.object.isRequired,
  invertX: PropTypes.bool,
  invertY: PropTypes.bool,
  numTextRows: PropTypes.number,
};

CellInfo.defaultProps = {
  width: 200,
  invertX: false,
  invertY: false,
  numTextRows: 0,
};

export default CellInfo;
