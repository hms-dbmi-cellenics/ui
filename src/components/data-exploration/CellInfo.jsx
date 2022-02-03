import React from 'react';
import _ from 'lodash';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const CellInfo = (props) => {
  const { coordinates, cellInfo } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const renderCellInfo = () => (
    <Card
      size='small'
      style={{
        zIndex: 6,
        border: 0,
        position: 'absolute',
        left: `${coordinates.current.x + 20}px`,
        top: `${coordinates.current.y + 20}px`,
        pointerEvents: 'none',
      }}
    >
      {cellInfo.cellId ? (
        <div style={cellInfoStyle}>
          {`Cell id: ${cellInfo.cellId}`}
        </div>
      ) : <></>}
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

  if (cellInfo.cellId && Object.keys(coordinates.current).length > 0) {
    return renderCellInfo();
  }

  return (<></>);
};

CellInfo.defaultProps = {};

CellInfo.propTypes = {
  coordinates: PropTypes.object.isRequired,
  cellInfo: PropTypes.object.isRequired,
};

export default CellInfo;
