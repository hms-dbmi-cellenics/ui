import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

const CellInfo = (props) => {
  const { coordinates, cellInfo } = props;
  const { geneName, expression, cellSets } = cellInfo;

  const cellInfoStyle = { fontSize: '0.75rem', display: 'inlineBlock' };

  return (
    <div
      style={{
        minWidth: '175px',
        padding: '0.5em',
        background: '#FEFEFE',
        position: 'absolute',
        left: `${coordinates.x + 8}px`,
        top: `${coordinates.y + 8}px`,
        pointerEvents: 'none',
      }}
    >
      <div style={cellInfoStyle}>
        {`Cell id: ${cellInfo.cellId}`}
      </div>
      {geneName ? (
        <div style={cellInfoStyle}>
          {`Gene name: ${geneName}`}
        </div>
      ) : <></>}
      {expression ? (
        <div style={cellInfoStyle}>
          Expression Level:&nbsp;
          {parseFloat(expression.toFixed(3))}
        </div>
      ) : <></>}
      {cellSets?.length > 0 ? cellSets.map((cellSetName) => (
        <div style={cellInfoStyle}>{cellSetName}</div>
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
