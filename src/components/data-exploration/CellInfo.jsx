import React, { useCallback, useState } from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';

const EM = 16; // px
const CELLINFO_Y_PADDING = 2 * EM;

const cellInfoStyle = { fontSize: '0.75rem' };

const getCellinfoCoordinates = (coordinates, el, boundingX, boundingY) => {
  const popupWidth = el?.offsetWidth;
  const popupHeight = el?.offsetHeight;

  const invertX = () => coordinates.x + popupWidth > boundingX;
  const invertY = () => coordinates.y + popupHeight + CELLINFO_Y_PADDING > boundingY;

  const left = invertX() ? coordinates.x - (popupWidth + EM) : coordinates.x + EM;
  const top = invertY() ? coordinates.y - (popupHeight + EM) : coordinates.y + EM;

  return { left, top };
};

const CellInfo = (props) => {
  const {
    containerWidth, containerHeight, coordinates, cellInfo,
  } = props;

  const [tooltipEl, setTooltipEl] = useState(null);

  const getTooltipElement = useCallback((el) => {
    if (el) setTooltipEl(el?.firstChild);
  }, []);

  const { left, top } = getCellinfoCoordinates(
    coordinates,
    tooltipEl,
    containerWidth,
    containerHeight,
  );

  return (
    // We have to wrap the <Card> in a <div> because Antd does not correctly set the ref
    // https://github.com/ant-design/ant-design/issues/28582
    <div style={{ display: 'inline-block' }} ref={getTooltipElement}>
      <Card
        size='small'
        style={{
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
    </div>
  );
};

CellInfo.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  coordinates: PropTypes.object.isRequired,
  cellInfo: PropTypes.object.isRequired,
};

export default CellInfo;
