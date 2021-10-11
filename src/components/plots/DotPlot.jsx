import React from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { generateSpec } from 'utils/plotSpecs/generateDotPlotSpec';

const DotPlot = (props) => {
  const { config } = props;

  // Mock data, to be replaced with real data
  const plotData = [
    {
      gene: 'gene1',
      cluster: 'cluster1',
      AvgExpression: 1.2,
      cellsFraction: 1,
    },
    {
      gene: 'gene1',
      cluster: 'cluster2',
      AvgExpression: 2.4,
      cellsFraction: 0.7,
    },
    {
      gene: 'gene1',
      cluster: 'cluster3',
      AvgExpression: 9.3,
      cellsFraction: 0.1,
    },
    {
      gene: 'gene2',
      cluster: 'cluster1',
      AvgExpression: 1.2,
      cellsFraction: 0.43,
    },
    {
      gene: 'gene2',
      cluster: 'cluster2',
      AvgExpression: 2.4,
      cellsFraction: 0.7,
    },
    {
      gene: 'gene2',
      cluster: 'cluster3',
      AvgExpression: 9.3,
      cellsFraction: 0.1,
    },
    {
      gene: 'gene3',
      cluster: 'cluster1',
      AvgExpression: 1.2,
      cellsFraction: 0.43,
    },
    {
      gene: 'gene3',
      cluster: 'cluster2',
      AvgExpression: 2.4,
      cellsFraction: 0.7,
    },
    {
      gene: 'gene3',
      cluster: 'cluster3',
      AvgExpression: 9.3,
      cellsFraction: 0.1,
    },
  ];

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
