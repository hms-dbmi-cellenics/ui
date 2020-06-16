import React from 'react';
import { useSelector } from 'react-redux';
import { Empty, Spin } from 'antd';
import VegaHeatmap from './VegaHeatmap';

const HeatmapPlot = () => {
  const heatmapSpec = useSelector((state) => state.heatmapSpec);
  const geneExperessionData = useSelector((state) => state.geneExperessionData);
  const selectedGenes = useSelector((state) => state.selectedGenes);

  if (!selectedGenes.geneList || Object.keys(selectedGenes.geneList).length === 0) {
    return (
      <center>
        <Empty
          description={(
            <span>
              Please select Gene(s) from Gene Set tool
            </span>
          )}
        />
      </center>
    );
  }

  if (geneExperessionData.isLoading || heatmapSpec.rendering) {
    return (<center><Spin size='large' /></center>);
  }

  return (
    <VegaHeatmap
      spec={heatmapSpec}
    />
  );
};

export default HeatmapPlot;
