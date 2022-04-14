// The goal is to minimize space with the largest possible dot size along the larger axis
const getDotDimensions = (config, numClusters) => {
  const plotWidth = config.dimensions.width;
  const plotHeight = config.dimensions.height;
  const padding = 1;

  const numGenes = config.useMarkerGenes
    ? config.nMarkerGenes * numClusters
    : config.selectedGenes.length;

  // Adjustment is added to counter the blowing up of dot sizes
  // when there is a small number of data points. The effect of the
  // adjustment is to make the dot size smaller. Its effect diminishes
  // as the number of data points increases.
  const adjustment = 2;
  const heightPerDot = plotHeight / (numClusters + adjustment);
  const widthPerDot = plotWidth / (numGenes + adjustment);

  // Use the smaller of the two dimensions to determine the max dot size
  // Radius is half the width or height. This radius still contain padding that we want to remove
  const radiusWithPadding = Math.floor(Math.min(heightPerDot, widthPerDot) / 2);
  let radius = radiusWithPadding - padding;

  // Small number of data will cause dots to appear very big. This limits the size
  // (via the radius) that the dots can be.
  const maxRadius = 20;
  radius = Math.min(radius, maxRadius);

  // Radius for 0 data
  const minArea = 10;

  // We have to calculate the area because that is what is expected Vega's draw function
  const maxArea = minArea + Math.PI * (radius ** 2);

  // The expected return value is the area of the circle
  return {
    minArea,
    maxArea,
    radius,
  };
};

const generateSpec = (config, plotData, numClusters) => {
  let legend = [];

  if (config.legend.enabled) {
    legend = [
      {
        title: 'Avg. Expression',
        titleColor: config.colour.masterColour,
        labelColor: config.colour.toggleInvert === '#FFFFFF' ? '#000000' : '#FFFFFF',
        orient: config.legend.position,
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        type: 'gradient',
        fill: 'color',
        direction: config.legend.direction,
      },
      {
        title: 'Percent Exp. (%)',
        titleColor: config.colour.masterColour,
        labelColor: config.colour.toggleInvert === '#FFFFFF' ? '#000000' : '#FFFFFF',
        orient: config.legend.position,
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        size: 'dotSize',
        symbolType: 'circle',
        symbolFillColor: '#aaaaaa',
        direction: config.legend.direction,
      },
    ];
  }

  const { minArea, radius, maxArea } = getDotDimensions(config, numClusters);

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
            as: 'size',
            expr: 'datum.cellsPercentage',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'point',
        range: 'width',
        domain: { data: 'plotData', field: 'geneName' },
        padding: radius / 2,
      },
      {
        name: 'y',
        type: 'point',
        range: 'height',
        padding: radius / 2,
        domain: {
          data: 'plotData',
          field: 'cellSets',
        },
      },
      {
        name: 'dotSize',
        type: 'pow',
        exponent: 2,
        domain: config.useAbsoluteScale ? [0, 100] : {
          data: 'plotData',
          field: 'size',
        },
        range: [
          minArea,
          maxArea,
        ],
      },
      {
        name: 'color',
        type: 'linear',
        domain: {
          data: 'plotData',
          field: 'avgExpression',
        },
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
            : config.colour.gradient,
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
        tooltip: {
          content: 'plotData',
        },
        shape: 'circle',
        zindex: 2,
        from: {
          data: 'plotData',
        },
        encode: {
          enter: {
            tooltip: {
              signal: `{
                'Avg. Expression': format(datum.avgExpression, '.2f'),
                'Percent Exp.(%)': format(datum.cellsPercentage, '.2f')
              }`,
            },
          },
          update: {
            xc: {
              scale: 'x',
              field: 'geneName',
            },
            yc: {
              scale: 'y',
              field: 'cellSets',
            },
            size: {
              scale: 'dotSize',
              field: 'size',
            },
            fill: {
              scale: 'color',
              field: 'avgExpression',
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
