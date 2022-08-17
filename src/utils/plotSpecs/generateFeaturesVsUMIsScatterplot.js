import { round } from 'lodash';
import { stdev } from '../mathFormulas';

const generateSpec = (config, plotData, expConfig) => {
  const { pointsData, linesData } = plotData;
  const { predictionInterval } = expConfig;

  const sd = stdev(pointsData.map((p) => p.log_genes));
  let predictionIntervalIndex;

  // if the prediction interval is not set yet
  // use a default value which is the last index in linesData
  if (!predictionInterval && predictionInterval !== 0) {
    predictionIntervalIndex = linesData.length - 1;
  } else if (predictionInterval <= 0.99) {
    predictionIntervalIndex = round((predictionInterval || 0) * 100);
  } else if (predictionInterval === 0.999) {
    predictionIntervalIndex = 100;
  } else if (predictionInterval === 0.9999) {
    predictionIntervalIndex = 101;
  } else if (predictionInterval === 0.99999) {
    predictionIntervalIndex = 102;
  } else if (predictionInterval === 0.999999) {
    predictionIntervalIndex = 103;
  }

  // if its the old model of the data, do not use the prediction interval variable
  const selectedLinesData = linesData[0].length ? linesData[predictionIntervalIndex] : linesData;

  const lowerCutoff = Math.min(
    ...selectedLinesData.map((p) => p.lower_cutoff),
  ) - sd;
  const upperCutoff = Math.max(
    ...selectedLinesData.map((p) => p.upper_cutoff),
  ) + sd;

  const xScaleDomain = config.axesRanges.xAxisAuto
    ? { data: 'pointsData', field: 'log_molecules' }
    : [config.axesRanges.xMin, config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? [lowerCutoff, upperCutoff]
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    padding: 5,

    data: [
      {
        name: 'pointsData',
        values: pointsData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
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
      {
        name: 'linesData',
        values: selectedLinesData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        zero: false,
        domain: xScaleDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        zero: false,
        domain: yScaleDomain,
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
        clip: true,
        from: { data: 'pointsData' },
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
        type: 'line',
        clip: true,
        from: { data: 'linesData' },
        encode: {
          update: {
            x: { scale: 'x', field: 'log_molecules' },
            y: { scale: 'y', field: 'upper_cutoff' },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      },
      {
        type: 'line',
        clip: true,
        from: { data: 'linesData' },
        encode: {
          update: {
            x: { scale: 'x', field: 'log_molecules' },
            y: { scale: 'y', field: 'lower_cutoff' },
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
