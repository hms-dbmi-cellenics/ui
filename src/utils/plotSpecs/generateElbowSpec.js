const generateSpec = (config, plotData, numPCs) => {
  const xScaleDomain = config.axesRanges.xAxisAuto
    ? { data: 'plotData', field: 'PC' }
    : [Math.max(config.axesRanges.xMin, 0), config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'plotData', field: 'percent' }
    : [Math.max(config.axesRanges.yMin / 100, 0), Math.min(config.axesRanges.yMax / 100, 100)];

  return {
    width: config.dimensions.width,
    height: config.dimensions.height,
    background: config.colour.toggleInvert,
    autosize: { type: 'fit', resize: true },
    padding: 5,

    signals: config.signals,

    data: [
      {
        name: 'plotData',
        values: plotData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
        transform: [
          {
            type: 'formula',
            as: 'percent',
            expr: 'datum.percentVariance',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        range: 'width',
        zero: false,
        domain: xScaleDomain,
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        zero: false,
        domain: yScaleDomain,
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'x',
        grid: true,
        tickCount: 15,
        zindex: 1,
        title: config.axes.xAxisText,
        titleFont: config.axes.titleFont,
        labelFont: config.axes.labelFont,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        titleColor: config.colour.masterColour,
        offset: config.axes.offset,
        gridOpacity: (config.axes.gridOpacity / 20),
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        orient: 'left',
        scale: 'y',
        grid: true,
        tickCount: 15,
        format: '%',
        zindex: 1,
        title: config.axes.yAxisText,
        titleFont: config.axes.titleFont,
        labelFont: config.axes.labelFont,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        titleColor: config.colour.masterColour,
        offset: config.axes.offset,
        gridOpacity: (config.axes.gridOpacity / 20),
      },
    ],

    marks: [
      {
        type: 'line',
        clip: true,
        from: { data: 'plotData' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'PC' },
            y: { scale: 'y', field: 'percent' },
            strokeWidth: { value: 2 },
          },
          update: {
            interpolate: { signal: 'interpolate' },
            strokeOpacity: { value: 1 },
          },
          hover: {
            strokeOpacity: { value: 0.5 },
          },
        },
      },
      {
        type: 'rule',
        clip: true,
        encode: {
          update: {
            x: { scale: 'x', value: numPCs, round: true },
            y: 0,
            y2: { field: { group: 'height' } },
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
        anchor: config.title.anchor,
        font: config.title.font,
        fontSize: config.title.fontSize,
        dx: config.title.dx,
      },
  };
};

const generateData = () => { };

export { generateSpec, generateData };
