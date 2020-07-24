import React, { useState, useEffect } from 'react';
import {
  useSelector,
} from 'react-redux';

const HeatmapCrossHairs = () => {
  const cellInfo = useSelector((state) => state.cellInfo);
  const [crossHairsVisible, setCrossHairsVisible] = useState(false);

  useEffect(() => {
    if (!cellInfo.cellName && crossHairsVisible) {
      setCrossHairsVisible(false);
    } else if (cellInfo.cellName && !crossHairsVisible) {
      setCrossHairsVisible(true);
    }
  }, [cellInfo]);


  const cellNameInput = document.getElementById('cellNameInput');
  const geneNameInput = document.getElementById('geneNameInput');

  if (!cellNameInput || !geneNameInput) {
    return (
      <div id='heatmapHoverBox' style={{ display: 'none' }} />
    );
  }

  const event = new Event('input', {
    bubbles: true,
    cancelable: true,
  });

  if (crossHairsVisible) {
    if (cellNameInput.value !== cellInfo.cellName) {
      cellNameInput.value = cellInfo.cellName;
      cellNameInput.dispatchEvent(event);
    }
    if (cellInfo.geneName && geneNameInput.value !== cellInfo.geneName) {
      geneNameInput.value = cellInfo.geneName;
      geneNameInput.dispatchEvent(event);
    } else if (!cellInfo.geneName) {
      geneNameInput.value = undefined;
      geneNameInput.dispatchEvent(event);
    }
  } else {
    if (cellNameInput.value !== undefined) {
      cellNameInput.value = undefined;
      cellNameInput.dispatchEvent(event);
    }
    if (geneNameInput.value !== undefined) {
      geneNameInput.value = undefined;
      geneNameInput.dispatchEvent(event);
    }
  }

  return (
    <div id='heatmapHoverBox' style={{ display: 'none' }} />
  );
};

HeatmapCrossHairs.defaultProps = {};

HeatmapCrossHairs.propTypes = {
};


export default HeatmapCrossHairs;
