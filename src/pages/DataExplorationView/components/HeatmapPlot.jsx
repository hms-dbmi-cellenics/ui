import React from 'react';
import dynamic from 'next/dynamic';
import cells from './linnarsson.cells.json';
import clusters from './linnarsson.clusters.json';
import 'vitessce/dist/es/production/static/css/index.css';

const Heatmap = dynamic(
  () => import('vitessce/dist/es/production/heatmap.min.js').then((mod) => mod.Heatmap),
  { ssr: false },
);


const HeatmapPlot = () => {
  const uuid = 'my-heatmap';
  const cellColors = null;
  const selectedCellIds = new Set();
  // eslint-disable-next-line no-unused-vars
  const updateCellsHover = (hoverInfo) => { };
  // eslint-disable-next-line no-unused-vars
  const updateStatus = (message) => { };
  // eslint-disable-next-line no-unused-vars
  const clearPleaseWait = (layerName) => { };

  return (
    <div className='vitessce-container vitessce-theme-light' style={{ width: '100%', position: 'relative' }}>
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
