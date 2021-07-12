/* eslint-disable no-param-reassign */
const generateSpec = (config, plotData) => {
  let legend = [];

  const colorFieldName = plotData[0]?.color ? 'color' : 'col';

  if (config?.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';

    const legendColumns = positionIsRight ? 1 : Math.floor(config.dimensions.width / 85);
    const labelLimit = positionIsRight ? 0 : 85;

    legend = [
      {
        fill: 'cellSetColors',
        title: config?.legend.title || 'Cluster Name',
        titleColor: config?.colour.masterColour,
        type: 'symbol',
        orient: config?.legend.position,
        offset: 40,
        symbolType: 'square',
        symbolSize: 200,
        encode: {
          labels: {
            update: {
              text: {
                scale: 'sampleToName', field: 'label',
              },
              fill: { value: config?.colour.masterColour },
            },

          },
        },
        direction: 'horizontal',
        labelFont: config?.fontStyle.font,
        titleFont: config?.fontStyle.font,
        columns: legendColumns,
        labelLimit,
      },
    ];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config?.dimensions.width,
    height: config?.dimensions.height,
    autosize: 'fit',
    background: config?.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'values',
        values: plotData,
      },
      {
        name: 'labels',
        source: 'values',
        transform: [
          {
            type: 'aggregate', groupby: ['cluster'], fields: ['x', 'y'], ops: ['mean', 'mean'], as: ['meanX', 'meanY'],
          },
        ],
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'values', field: 'x' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: { data: 'values', field: 'y' },
        range: 'height',
      },
      {
        name: 'cellSetColors',
        type: 'ordinal',
        range: { data: 'values', field: colorFieldName },
        domain: { data: 'values', field: 'cluster' },
      },
      {
        name: 'sampleToName',
        type: 'ordinal',
        range: { data: 'values', field: 'cluster' },
        domain: { data: 'values', field: 'cluster' },
      },
    ],
    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config?.axes.xAxisText,
        titleFont: config?.fontStyle.font,
        labelFont: config?.fontStyle.font,
        labelColor: config?.colour.masterColour,
        tickColor: config?.colour.masterColour,
        gridColor: config?.colour.masterColour,
        gridOpacity: (config?.axes.gridOpacity / 20),
        gridWidth: (config?.axes.gridWidth / 20),
        offset: config?.axes.offset,
        titleFontSize: config?.axes.titleFontSize,
        titleColor: config?.colour.masterColour,
        labelFontSize: config?.axes.labelFontSize,
        domainWidth: config?.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: config?.colour.masterColour,
        gridOpacity: (config?.axes.gridOpacity / 20),
        gridWidth: (config?.axes.gridWidth / 20),
        tickColor: config?.colour.masterColour,
        offset: config?.axes.offset,
        title: config?.axes.yAxisText,
        titleFont: config?.fontStyle.font,
        labelFont: config?.fontStyle.font,
        labelColor: config?.colour.masterColour,
        titleFontSize: config?.axes.titleFontSize,
        titleColor: config?.colour.masterColour,
        labelFontSize: config?.axes.labelFontSize,
        domainWidth: config?.axes.domainWidth,
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'values' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
            size: { value: config?.marker.size },
            stroke: { scale: 'cellSetColors', field: 'cluster' },
            fill: { scale: 'cellSetColors', field: 'cluster' },
            shape: { value: config?.marker.shape },
            fillOpacity: { value: config?.marker.opacity / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'labels' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'meanX' },
            y: { scale: 'y', field: 'meanY' },
            text: { scale: 'sampleToName', field: 'cluster' },
            fontSize: config?.label.size,
            strokeWidth: 1.2,
            fill: config?.colour.masterColour,
            fillOpacity: config?.label.enabled,
            font: config?.fontStyle.font,

          },
          transform: [
            { type: 'label', size: ['width', 'height'] }],
        },
      },
    ],
    legends: legend,
    title:
    {
      text: config?.title.text,
      color: config?.colour.masterColour,
      anchor: config?.title.anchor,
      font: config?.fontStyle.font,
      dx: 10,
      fontSize: config?.title.fontSize,
    },
  };
};

const filterCells = (cellSets, selectedCellSet) => {
  let newCellSets = cellSets.hierarchy.find(
    (rootNode) => rootNode.key === selectedCellSet,
  )?.children || [];

  // Build up the data source based on the properties. Note that the child nodes
  // in the hierarchy are /objects/ with a `key` property, hence the destructuring
  // in the function.
  newCellSets = newCellSets.flatMap(({ key }) => {
    const cells = Array.from(cellSets.properties[key].cellIds);

    return cells.map((cellId) => ({
      cellId,
      cluster: cellSets.properties[key].name,
      color: cellSets.properties[key].color,
    }));
  });

  return newCellSets;
};

// Generate dynamic data from redux store
const generateData = (cellSets, selectedCellSet, embeddingData) => {
  const newCellSets = filterCells(cellSets, selectedCellSet);

  const test = newCellSets
    .filter((d) => d.cellId < embeddingData.length)
    .filter((data) => embeddingData[data.cellId]) // filter out cells removed in data processing
    .map((data) => {
      const { cellId, ...leftOverData } = data;

      return {
        ...leftOverData,
        x: embeddingData[cellId][0],
        y: embeddingData[cellId][1],
      };
    });

  return test;
};

export {
  generateSpec,
  generateData,
  filterCells,
};
