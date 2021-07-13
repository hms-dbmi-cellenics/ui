import { stdev } from '../mathFormulas';

const generateSpec = (config, plotData) => {
  const sd = stdev(plotData.map((p) => p.log_genes));
  const lowerCutoff = Math.min(...plotData.map((p) => p.lower_cutoff)) - sd;
  const upperCutoff = Math.max(...plotData.map((p) => p.upper_cutoff)) + sd;

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    padding: 5,

    data: [
      {
        name: 'plotData',
        values: plotData,
        transform: [
          {
            type: 'filter',
            expr: "datum['log_genes'] != null && datum['log_molecules'] != null",
          },
          {
            type: 'filter',
            expr: `datum.log_genes >= ${lowerCutoff} && datum.log_genes <= ${upperCutoff}`,
          },
        ],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        zero: false,
        domain: { data: 'plotData', field: 'log_molecules' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        zero: false,
        domain: [
          lowerCutoff,
          upperCutoff,
        ],
        range: 'height',
      },
    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: false,
        orient: 'bottom',
        tickCount: 5,
        zindex: 1,
        title: config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        offset: config.axes.offset,
        gridOpacity: (config.axes.gridOpacity / 20),
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: false,
        orient: 'left',
        titlePadding: 5,
        zindex: 1,
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        offset: config.axes.offset,
        gridOpacity: (config.axes.gridOpacity / 20),
      },
    ],

    marks: [
      {
        name: 'marks',
        type: 'symbol',
        from: { data: 'plotData' },
        encode: {
          update: {
            x: { scale: 'x', field: 'log_molecules' },
            y: { scale: 'y', field: 'log_genes' },
            size: { value: 15 },
            strokeWidth: { value: 2 },
            opacity: { value: 0.9 },
            fill: { value: 'blue' },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: { scale: 'x', value: plotData[0].log_molecules },
            y: { scale: 'y', value: plotData[0].lower_cutoff },
            x2: { scale: 'x', value: plotData[plotData.length - 1].log_molecules },
            y2: { scale: 'y', value: plotData[plotData.length - 1].lower_cutoff },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: { scale: 'x', value: plotData[0].log_molecules },
            y: { scale: 'y', value: plotData[0].upper_cutoff },
            x2: { scale: 'x', value: plotData[plotData.length - 1].log_molecules },
            y2: { scale: 'y', value: plotData[plotData.length - 1].upper_cutoff },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      },
    ],
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

export default generateSpec;
