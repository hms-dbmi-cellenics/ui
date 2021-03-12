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
        labelColor: { value: config.colour.masterColour },
        titleColor: { value: config.colour.masterColour },
        labels: {
          interactive: true,
          update: {
            fontSize: { value: 12 },
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
        range: { scheme: config.colour.gradient },
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
        title: { value: config.axes.xAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        tickColor: { value: config.colour.masterColour },
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        tickColor: { value: config.colour.masterColour },
        offset: { value: config.axes.offset },
        title: { value: config.axes.yAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
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
      text: { value: config.title.text },
      color: { value: config.colour.masterColour },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: { value: config.title.dx },
      fontSize: { value: config.title.fontSize },
    },
  };
};

const generateData = (
  embeddingData,
  cellMetaData,
) => embeddingData.map((cell, idx) => ({

  x: cell[0],
  y: cell[1],
  value: cellMetaData[idx],

}));

export {
  generateSpec,
  generateData,
};
