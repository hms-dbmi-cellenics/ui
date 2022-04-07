import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

const CellInfo = (props) => {
  const { coordinates, cellInfo } = props;

  const cellInfoStyle = { fontSize: '0.75rem', display: 'inlineBlock' };

  return (
    <div
      style={{
        minWidth: '125px',
        padding: '0.5em',
        background: 'white',
        position: 'absolute',
        left: `${coordinates.current.x + 8}px`,
        top: `${coordinates.current.y + 8}px`,
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
    </div>
  );
};

CellInfo.defaultProps = {};

CellInfo.propTypes = {
  coordinates: PropTypes.object.isRequired,
  cellInfo: PropTypes.object.isRequired,
};

export default CellInfo;
