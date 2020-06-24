import React from 'react';
import { useSelector } from 'react-redux';
import { Empty, Spin } from 'antd';
import VegaHeatmap from './VegaHeatmap';

const HeatmapPlot = () => {
  const heatmapSpec = useSelector((state) => state.heatmapSpec);
  const geneExpressionData = useSelector((state) => state.geneExpressionData);
  const selectedGenes = useSelector((state) => state.selectedGenes);
  const showAxes = useSelector((state) => state.heatmapSpec?.showAxes);

  if (!selectedGenes.geneList || Object.keys(selectedGenes.geneList).length === 0) {
    return (
      <center>
        <Empty
          description={(
            <span>
              Please select gene(s) from the Gene list tool
            </span>
          )}
        />
      </center>
    );
  }

  if (geneExpressionData.isLoading || heatmapSpec.rendering) {
    return (<center><Spin size='large' /></center>);
  }

  return (
    <VegaHeatmap
      spec={heatmapSpec}
      showAxes={showAxes}
    />
  );
};

export default HeatmapPlot;
