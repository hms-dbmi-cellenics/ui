import React, { useLayoutEffect, useRef, useState } from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';
import getCellInfoCoordinates from 'utils/data-exploration/getCellInfoCoordinates';

const cellInfoStyle = { fontSize: '0.75rem' };
const labelStyle = { fontWeight: 600 };

const HeatmapTracksCellInfo = (props) => {
  const {
    containerWidth, containerHeight, cellId, trackName, coordinates,
  } = props;

  const wrapperRef = useRef(null);
  const [tooltipDimensions, setTooltipDimensions] = useState({ width: 0, height: 0 });

  // Re-measure on every render (the card resizes with its content) before paint,
  // only setting state on a real change; a one-shot ref left dimensions stale and
  // a bigger tooltip got clamped against the previous cell's size and cut off.
  useLayoutEffect(() => {
    const card = wrapperRef.current?.firstChild;
    if (!card) return;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    setTooltipDimensions((prev) => (
      prev.width === width && prev.height === height ? prev : { width, height }
    ));
  });

  const { left } = getCellInfoCoordinates(
    coordinates,
    tooltipDimensions,
    containerWidth,
    containerHeight,
  );

  const renderCellInfo = () => (
    // We have to wrap the <Card> in a <div> because Antd does not correctly set the ref
    // https://github.com/ant-design/ant-design/issues/28582
    <div ref={wrapperRef}>
      <Card
        size='small'
        style={{
          zIndex: 6,
          border: 0,
          position: 'absolute',
          left,
          top: '20px',
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
        {trackName ? (
          <div style={cellInfoStyle}>
            <span style={labelStyle}>Group name:</span>
            {` ${trackName}`}
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

HeatmapTracksCellInfo.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  cellId: PropTypes.string.isRequired,
  coordinates: PropTypes.object.isRequired,
  trackName: PropTypes.string.isRequired,
};

export default HeatmapTracksCellInfo;
