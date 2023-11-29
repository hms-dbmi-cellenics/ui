import React, { useCallback, useState } from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';
import getCellInfoCoordinates from 'utils/data-exploration/getCellInfoCoordinates';

const cellInfoStyle = { fontSize: '0.75rem' };

const CellInfo = (props) => {
  const {
    containerWidth, containerHeight, coordinates, cellInfo,
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

  return (
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
          <div key={`${cellSetName}-key`} style={cellInfoStyle}>
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
