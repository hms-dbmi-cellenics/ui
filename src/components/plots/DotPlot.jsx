import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { generateSpec } from 'utils/plotSpecs/generateDotPlotSpec';

const DotPlot = (props) => {
  const { config } = props;

  // Mock data, delete this once we have the real data
  const generateMockData = (numClusters, numGenes) => {
    const mockPlotData = [];

    for (let i = 0; i < numClusters; i += 1) {
      for (let j = 0; j < numGenes; j += 1) {
        mockPlotData.push({
          gene: `gene${i}`,
          cluster: `cluster${j}`,
          AvgExpression: Math.random() * 10,
          cellsFraction: Math.random(),
        });
      }
    }

    return mockPlotData;
  };

  const plotData = generateMockData(12, 5);

  const actions = {
    export: true,
    source: false,
    compiled: false,
    editor: false,
  };

  return (
    <center>
      <Vega spec={generateSpec(config, plotData)} renderer='canvas' actions={actions} />
    </center>
  );
};

DotPlot.propTypes = {
  config: PropTypes.object.isRequired,
};

export default DotPlot;
