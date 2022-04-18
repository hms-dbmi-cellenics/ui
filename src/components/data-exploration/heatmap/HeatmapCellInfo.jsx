import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const HeatmapCellInfo = (props) => {
  const {
    width, cellId, geneName, geneExpression, coordinates, invertX, invertY,
  } = props;

  const cellInfoStyle = { fontSize: '0.75rem' };

  const left = invertX ? coordinates.x - 210 : coordinates.x + 20;
  const top = invertY ? coordinates.y - 70 : coordinates.y + 20;

  const renderCellInfo = () => (
    <Card
      size='small'
      style={{
        zIndex: 6,
        border: 0,
        width,
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

HeatmapCellInfo.defaultProps = {
  width: 200,
  invertX: false,
  invertY: false,
};

HeatmapCellInfo.propTypes = {
  width: PropTypes.number,
  invertX: PropTypes.bool,
  invertY: PropTypes.bool,
  cellId: PropTypes.string.isRequired,
  geneName: PropTypes.string.isRequired,
  geneExpression: PropTypes.number.isRequired,
  coordinates: PropTypes.object.isRequired,
};

export default HeatmapCellInfo;
