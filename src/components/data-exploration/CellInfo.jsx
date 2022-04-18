import React from 'react';
import truncate from 'lodash/truncate';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const CellInfo = (props) => {
  const {
    width, coordinates, cellInfo, invertX, invertY,
  } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const left = invertX ? coordinates.x - 210 : coordinates.x + 20;
  const top = invertY ? coordinates.y - 70 : coordinates.y + 20;

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
          {truncate(cellSetName)}
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
};

CellInfo.defaultProps = {
  width: 200,
  invertX: false,
  invertY: false,
};

export default CellInfo;
