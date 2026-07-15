import React, { useLayoutEffect, useRef, useState } from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';
import getCellInfoCoordinates from 'utils/data-exploration/getCellInfoCoordinates';

const cellInfoStyle = { fontSize: '0.75rem' };
const labelStyle = { fontWeight: 600 };

// One tooltip line: a bold category label ("Cell id:", "Samples:", …) followed
// by its value.
const InfoRow = ({ label, value }) => (
  <div style={cellInfoStyle}>
    <span style={labelStyle}>{label}</span>
    {value !== undefined && value !== null && value !== '' ? ` ${value}` : ''}
  </div>
);

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
InfoRow.defaultProps = { value: undefined };

const CellInfo = (props) => {
  const {
    containerWidth, containerHeight, coordinates, cellInfo,
  } = props;

  const wrapperRef = useRef(null);
  const [tooltipDimensions, setTooltipDimensions] = useState({ width: 0, height: 0 });

  // Re-measure on every render (the card resizes as its content changes between
  // cells), before paint so the position never flashes. Only set state when the
  // size actually changed, otherwise this would loop. Using a one-shot ref
  // callback instead left the dimensions stale, so a bigger tooltip was clamped
  // against the previous cell's smaller size and got cut off.
  useLayoutEffect(() => {
    const card = wrapperRef.current?.firstChild;
    if (!card) return;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    setTooltipDimensions((prev) => (
      prev.width === width && prev.height === height ? prev : { width, height }
    ));
  });

  const { left, top } = getCellInfoCoordinates(
    coordinates,
    tooltipDimensions,
    containerWidth,
    containerHeight,
  );

  return (
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
          top,
          // keep each line on one row — near a panel edge the card would
          // otherwise wrap mid-label and grow tall; we reposition it to fit
          // (getCellInfoCoordinates) rather than reflow it
          whiteSpace: 'nowrap',
          // partially translucent so the plot underneath stays visible
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      >
        <InfoRow label='Cell id:' value={cellInfo.cellId} />
        {cellInfo.geneName ? (
          <InfoRow label='Gene name:' value={cellInfo.geneName} />
        ) : <></>}
        {cellInfo.expression !== undefined ? (
          <InfoRow label='Expression Level:' value={parseFloat(cellInfo.expression.toFixed(3))} />
        ) : <></>}
        {cellInfo.cellSets?.length > 0 ? cellInfo.cellSets.map((cellSetName) => {
          // cell-set entries are "Parent: value" (e.g. "Samples: sample-1") —
          // bold the parent label, leave the value plain
          const colonIndex = cellSetName.indexOf(':');
          const label = colonIndex >= 0 ? cellSetName.slice(0, colonIndex + 1) : cellSetName;
          const value = colonIndex >= 0 ? cellSetName.slice(colonIndex + 1).trim() : '';
          return <InfoRow key={`${cellSetName}-key`} label={label} value={value} />;
        }) : <></>}
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
