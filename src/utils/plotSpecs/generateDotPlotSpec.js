const generateSpec = (config, plotData) => {
  let legend = [];

  if (config.legend.enabled) {
    legend = [
      {
        title: 'Average expression',
        titleColor: config.colour.masterColour,
        orient: config.legend.position,
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        type: 'gradient',
        fill: 'color',
        direction: 'horizontal',
      },
      {
        title: 'Percent Exp. (%)',
        titleColor: config.colour.masterColour,
        orient: config.legend.position,
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        size: 'dotSize',
        format: 's',
        symbolStrokeColor: '#4682b4',
        symbolStrokeWidth: 2,
        symbolOpacity: 0.5,
        symbolType: 'circle',
      },
    ];
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colour.toggleInvert,
    padding: 5,

    data: [
      {
        name: 'plotData',
        values: plotData,
        transform: [
          {
            type: 'formula',
            as: 'size',
            expr: 'datum.cellsFraction * 100',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'point',
        range: 'width',
        domain: { data: 'plotData', field: 'gene' },
        padding: 0.2,
      },
      {
        name: 'y',
        type: 'point',
        range: 'height',
        padding: 0.2,
        domain: {
          data: 'plotData',
          field: 'cluster',
        },
      },
      {
        name: 'dotSize',
        type: 'linear',
        domain: {
          data: 'plotData',
          field: 'size',
        },
        range: [
          0,
          100,
        ],
      },
      {
        name: 'color',
        type: 'linear',
        domain: {
          data: 'plotData',
          field: 'AvgExpression',
        },
        range: {
          scheme: 'blues',
        },
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'x',
        zindex: 1,
        grid: true,
        title: config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        offset: config.axes.offset,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        orient: 'left',
        scale: 'y',
        zindex: 1,
        grid: true,
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
        zindex: 2,
        from: {
          data: 'plotData',
        },
        encode: {
          enter: {
            xc: {
              scale: 'x',
              field: 'gene',
            },
            yc: {
              scale: 'y',
              field: 'cluster',
            },
            size: {
              scale: 'dotSize',
              field: 'size',
            },
            fill: {
              scale: 'color',
              field: 'AvgExpression',
            },
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
      dx: 10,
      fontSize: config.title.fontSize,
    },
  };
};

export {
  // eslint-disable-next-line import/prefer-default-export
  generateSpec,
};
