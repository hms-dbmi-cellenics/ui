import React from 'react';
import _ from 'lodash';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const CellInfo = (props) => {
  const { coordinates, cellInfo, invert } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const left = invert ? coordinates.current.x - 210 : coordinates.current.x + 20;
  const top = invert ? coordinates.current.y - 70 : coordinates.current.y + 20;

  return (
    <Card
      size='small'
      style={{
        width: 200,
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
          {_.truncate(cellSetName)}
        </div>
      )) : <></>}
    </Card>
  );
};

CellInfo.defaultProps = {};

CellInfo.propTypes = {
  coordinates: PropTypes.object.isRequired,
  cellInfo: PropTypes.object.isRequired,
  invert: PropTypes.bool.isRequired,
};

export default CellInfo;
