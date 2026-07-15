import React, { useState, useCallback } from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';
import getCellInfoCoordinates from 'utils/data-exploration/getCellInfoCoordinates';

const cellInfoStyle = { fontSize: '0.75rem' };
const labelStyle = { fontWeight: 600 };

const HeatmapCellInfo = (props) => {
  const {
    containerWidth, containerHeight,
    cellId, geneName,
    geneExpression, coordinates,
  } = props;

  const [tooltipDimensions, setTooltipDimensions] = useState({ width: 0, height: 0 });

  const getTooltipElement = useCallback((el) => {
    if (!el) return;

    setTooltipDimensions({
      width: el.firstChild.offsetWidth,
      height: el.firstChild.offsetHeight,
    });
  }, []);

  const { left, top } = getCellInfoCoordinates(
    coordinates,
    tooltipDimensions,
    containerWidth,
    containerHeight,
  );

  const renderCellInfo = () => (
    // We have to wrap the <Card> in a <div> because Antd does not correctly set the ref
    // https://github.com/ant-design/ant-design/issues/28582
    <div ref={getTooltipElement}>
      <Card
        size='small'
        style={{
          zIndex: 6,
          border: 0,
          position: 'absolute',
          left,
          top,
          // keep each line on one row instead of wrapping mid-label near an edge
          whiteSpace: 'nowrap',
          // partially translucent so the heatmap underneath stays visible
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      >
        {cellId ? (
          <div style={cellInfoStyle}>
            <span style={labelStyle}>Cell id:</span>
            {` ${cellId}`}
          </div>
        ) : <></>}
        {geneName ? (
          <div style={cellInfoStyle}>
            <span style={labelStyle}>Gene name:</span>
            {` ${geneName}`}
          </div>
        ) : <></>}
        {geneExpression !== undefined ? (
          <div style={cellInfoStyle}>
            <span style={labelStyle}>Expression:</span>
            &nbsp;
            {geneExpression}
          </div>
        ) : <></>}
      </Card>
    </div>
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
  geneExpression: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.oneOf([undefined, null])
  ]),
  coordinates: PropTypes.object.isRequired,
};

export default HeatmapCellInfo;
