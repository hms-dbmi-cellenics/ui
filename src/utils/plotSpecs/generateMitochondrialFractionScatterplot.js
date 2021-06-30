const generateSpec = (config, plotData) => {
  let legend = null;
  const maxPercentage = config.maxFraction * 100;

  const deadOrAlive = `(datum.fracMito <= ${maxPercentage}) ? 'Alive' : 'Dead'`;

  legend = !config.legend.enabled ? null : [
    {
      fill: 'color',
      orient: config.legend.position,
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      encode: {
        title: {
          update: {
            fontSize: { value: 14 },
          },
        },
        labels: {
          interactive: true,
          update: {
            fontSize: { value: 12 },
            fill: { value: 'black' },
          },
        },
        symbols: {
          update: {
            stroke: { value: 'transparent' },
          },
        },
        legend: {
          update: {
            stroke: { value: '#ccc' },
            strokeWidth: { value: 1.5 },
          },
        },
      },
    }];

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
            type: 'formula',
            as: 'status',
            expr: deadOrAlive,
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xscale',
        type: 'linear',
        range: 'width',
        domain: [0, 100],
      },
      {
        name: 'yscale',
        type: 'linear',
        range: 'height',
        round: true,
        domain: { data: 'plotData', field: 'cellSize' },
        zero: true,
        nice: true,
      },
      {
        name: 'color',
        type: 'ordinal',
        range:
          [
            'green', 'blue',
          ],
        domain: ['Alive', 'Dead'],
      },
    ],
    axes: [
      {
        orient: 'bottom',
        scale: 'xscale',
        zindex: 1,
        grid: true,
        title: { value: config.axes.xAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        titleFontSize: { value: config.axes.titleFontSize },
        labelFontSize: { value: config.axes.labelFontSize },
        offset: { value: config.axes.offset },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        orient: 'left',
        scale: 'yscale',
        tickCount: 5,
        grid: true,
        zindex: 1,
        title: { value: config.axes.yAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        titleFontSize: { value: config.axes.titleFontSize },
        labelFontSize: { value: config.axes.labelFontSize },
        offset: { value: config.axes.offset },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
      },
    ],
    marks: [
      {
        name: 'marks',
        type: 'symbol',
        from: { data: 'plotData' },
        encode: {
          update: {
            x: { scale: 'xscale', field: 'fracMito' },
            y: { scale: 'yscale', field: 'cellSize' },
            size: { value: 10 },
            shape: { value: 'circle' },
            strokeWidth: { value: 2 },
            opacity: { value: 0.5 },
            fill: {
              scale: 'color',
              field: 'status',
            },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: { scale: 'xscale', value: maxPercentage },
            y: { value: 0 },
            y2: { field: { group: 'height' } },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      },
    ],
    legends: legend,
    title:
    {
      text: { value: config.title.text },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: { value: config.title.dx },
      fontSize: { value: config.title.fontSize },
    },
  };
};

export default generateSpec;
