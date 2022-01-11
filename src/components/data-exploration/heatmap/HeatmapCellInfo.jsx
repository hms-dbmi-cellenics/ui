import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const HeatmapCellInfo = (props) => {
  const {
    cellId, geneName, geneExpression, coordinates,
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

HeatmapCellInfo.defaultProps = {};

HeatmapCellInfo.propTypes = {
  cellId: PropTypes.string.isRequired,
  geneName: PropTypes.string.isRequired,
  geneExpression: PropTypes.number.isRequired,
  coordinates: PropTypes.object.isRequired,
};

export default HeatmapCellInfo;
