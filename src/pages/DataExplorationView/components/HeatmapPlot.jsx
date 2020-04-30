import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Heatmap } from 'vitessce/build-lib/es/production/heatmap.min.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'vitessce/build-lib/es/production/static/css/index.css';

import cells from './linnarsson.cells.json';
import clusters from './linnarsson.clusters.json';


const HeatmapPlot = () => {
  const uuid = 'my-heatmap';
  const cellColors = null;
  const selectedCellIds = new Set();
  const updateCellsHover = (hoverInfo) => { console.log(hoverInfo); };
  const updateStatus = (message) => { };
  const clearPleaseWait = (layerName) => { };

  return (
    <div className="vitessce-container vitessce-theme-light" style={{ width: '100%', position: 'relative' }}>
      <Heatmap
        uuid={uuid}
        cells={cells}
        clusters={clusters}
        selectedCellIds={selectedCellIds}
        cellColors={cellColors}
        updateStatus={updateStatus}
        updateCellsHover={updateCellsHover}
        clearPleaseWait={clearPleaseWait}
      />
    </div>
  );
};

export default HeatmapPlot;
