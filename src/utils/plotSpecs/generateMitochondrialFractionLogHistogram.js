const generateSpec = (config, plotData) => {
  let legend = null;
  const deadOrAlive = '(datum.bin1 <= 2.5) ? \'Dead\' : (datum.bin1 >=3.5) ? \'Live\' : \'Unknown\'';

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
      },
      {
        name: 'binned',
        source: 'plotData',
        transform: [
          {
            type: 'bin',
            field: 'cellSize',
            extent: [0, 6],
            step: config.binStep,
            nice: false,
          },
          {
            type: 'aggregate',
            key: 'bin0',
            groupby: ['bin0', 'bin1'],
            fields: ['fracMito'],
            ops: ['average'],
            as: ['averageFracMito'],
          },
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
        domainMin: 1,
      },
      {
        name: 'yscale',
        type: 'linear',
        range: 'height',
        round: true,
        domain: { data: 'binned', field: 'averageFracMito' },
        zero: true,
        nice: true,
      },
      {
        name: 'color',
        type: 'ordinal',
        range:
          [
            'blue', 'green', 'grey',
          ],
        domain: {
          data: 'binned',
          field: 'status',
          sort: true,
        },
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
        type: 'rect',
        from: { data: 'binned' },
        encode: {
          update: {
            x: { scale: 'xscale', field: 'bin0' },
            x2: {
              scale: 'xscale',
              field: 'bin1',
            },
            y: { scale: 'yscale', field: 'averageFracMito' },
            y2: { scale: 'yscale', value: 0 },
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
            x: { scale: 'xscale', value: config.maxFraction },
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
