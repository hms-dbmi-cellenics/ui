/* eslint-disable no-param-reassign */
const generateSpec = (config, plotData) => {
  let legend = [];

  console.log('== DATA');
  console.log(plotData);

  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        orient: config.legend.position,
        title: 'pseudotime',
        gradientLength: 100,
        labelColor: config.colour.masterColour,
        titleColor: config.colour.masterColour,
        labels: {
          interactive: true,
          update: {
            fontSize: 12,
            fill: { value: config.colour.masterColour },
          },

        },
      }];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting gene expression in the context of UMAP.',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },

    background: config.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'pseudotime',
        values: plotData.pseudotime,
      },
      {
        name: 'graph',
        values: plotData.graph,
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'pseudotime', field: 'x' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'pseudotime', field: 'y' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'linear',
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'plasma' : 'darkgreen')
            : config.colour.gradient,
        },
        domain: { data: 'pseudotime', field: 'value' },
        reverse: config.colour.reverseCbar,
      },
    ],
    axes: [
      {
        scale: 'x',
        domain: true,
        orient: 'bottom',
        title: config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.gridWidth / 20),
        offset: config.axes.offset,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        tickColor: config.colour.masterColour,
        offset: config.axes.offset,
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
      },
    ],
    marks: [
      {
        type: 'symbol',
        shape: 'circle',
        from: { data: 'pseudotime' },
        encode: {
          enter: {
            xc: { scale: 'x', field: 'x' },
            yc: { scale: 'y', field: 'y' },
            size: { value: config.marker.size },
            stroke: {
              scale: 'color',
              field: 'value',
            },
            fill: {
              scale: 'color',
              field: 'value',
            },
            shape: { value: config.marker.shape },
            fillOpacity: { value: config.marker.opacity / 10 },
          },
        },
      },
      {
        type: 'line',
        from: { data: 'graph' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x1' },
            x2: { scale: 'x', field: 'x2' },
            y: { scale: 'y', field: 'y1' },
            y2: { scale: 'y', field: 'y2' },
          },
        },
      },
    ],
    legends: legend,
    title:
    {
      text: config.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

const generateData = (
  cellSets,
  rootNode,
  plotData,
  embeddingData,
) => {
  const parentNode = rootNode.split('/')[0];

  const cellSetKeys = cellSets.hierarchy.find(({ key }) => key === parentNode)
    .children.map(({ key }) => key);

  const cells = cellSetKeys.reduce(
    (cellSet, clusterKey) => cellSet.concat(Array.from(cellSets.properties[clusterKey].cellIds)),
    [],
  );

  const pseudotime = cells
    .filter((cellId) => embeddingData[cellId] !== null)
    .map((cellId) => ({
      x: embeddingData[cellId][0],
      y: embeddingData[cellId][1],
      value: plotData.pseudotime['1'][cellId],
    }));

  // Object inside the graph data has to be copied because it is not extensible
  // https://github.com/vega/vega/issues/2125
  const graph = plotData.graph.map((o) => ({ ...o }));

  return {
    pseudotime,
    graph,
  };
};

export {
  generateSpec,
  generateData,
};
