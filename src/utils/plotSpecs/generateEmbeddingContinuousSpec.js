/* eslint-disable no-param-reassign */
const generateSpec = (config, plotData) => {
  let legend = [];

  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        orient: config.legend.position,
        title: config.shownGene,
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
        name: 'plotData',
        values: plotData,
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'plotData', field: 'x' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'plotData', field: 'y' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'linear',
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
            : config.colour.gradient,
        },
        domain: { data: 'plotData', field: 'value' },
        reverse: config.colour.reverseCbar,
      },
    ],
    axes: [
      {
        scale: 'x',
        grid: true,
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
        grid: true,
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
        from: { data: 'plotData' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
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

const filterCells = (cellSets, selectedSample, embeddingData) => {
  let newCellSets = [];

  const cellSetHierarchyKeys = cellSets.hierarchy.map((value) => value.key);

  // Filter by cellSet
  if (cellSetHierarchyKeys.includes(selectedSample)) {
    newCellSets = cellSets.hierarchy.find(
      (rootNode) => rootNode.key === selectedSample,
    )?.children || [];

    // Build up the data source based on the properties. Note that the child nodes
    // in the hierarchy are /objects/ with a `key` property, hence the destructuring
    // in the function.
    newCellSets = newCellSets.flatMap(({ key }) => {
      const cells = Array.from(cellSets.properties[key].cellIds);

      return cells.map((cellId) => ({
        cellId,
      }));
    });

    // Filter by sample
  } else {
    newCellSets = embeddingData.map((_, cellId) => ({
      cellId,
    }));

    if (selectedSample !== 'All') {
      const cellIds = Array.from(cellSets.properties[selectedSample].cellIds);
      newCellSets = newCellSets.filter((val) => cellIds.includes(val.cellId));
    }
  }

  return newCellSets;
};

const generateData = (
  cellSets,
  selectedSample,
  plotData,
  embeddingData,
) => {
  const newCellSets = filterCells(cellSets, selectedSample, embeddingData);

  const cells = newCellSets
    .filter((d) => d.cellId < embeddingData.length)
    .filter((data) => embeddingData[data.cellId]) // filter out cells removed in data processing
    .map((data) => {
      const { cellId } = data;

      return {
        x: embeddingData[cellId][0],
        y: embeddingData[cellId][1],
        value: plotData[cellId],
      };
    });

  return cells;
};

export {
  generateSpec,
  generateData,
};
