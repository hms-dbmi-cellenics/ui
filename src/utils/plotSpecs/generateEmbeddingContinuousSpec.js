/* eslint-disable no-param-reassign */

const generateSpec = (config, method, plotData) => {
  const xScaleDomain = config.axesRanges.xAxisAuto
    ? { data: 'plotData', field: 'x' }
    : [config.axesRanges.xMin, config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'plotData', field: 'y' }
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  let legend = [];

  if (config.legend.enabled) {
    const positionIsLeftRight = ['left', 'right'].includes(config.legend.position);
    const legendTitle = config.legend.defaultValues?.includes('title')
      ? config.shownGene
      : (config.legend.title === '' ? null : config.legend.title);
    legend = [
      {
        fill: 'color',
        type: 'symbol',
        orient: config.legend.position,
        title: legendTitle,
        labelColor: config.colour.masterColour,
        titleColor: config.colour.masterColour,
        symbolType: 'circle',
        symbolSize: 100,
        offset: 40,
        direction: positionIsLeftRight ? 'vertical' : 'horizontal',
        encode: {
          labels: {
            update: {
              fontSize: { value: config.legend.labelFontSize || 11 },
            },
          },
          title: {
            update: {
              fontSize: { value: config.legend.titleFontSize || 12 },
            },
          },
        },
      }];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Continuous embedding plot',
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
        nice: true,
        zero: false,
        domain: xScaleDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        nice: true,
        zero: false,
        domain: yScaleDomain,
        range: 'height',
      },
      {
        name: 'color',
        type: 'quantize',
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
            : config.colour.gradient,
          count: 5,
        },
        domain: { data: 'plotData', field: 'value' },
        // spectral defaults to reversed; reverseCbar flips that (XOR). Mirrors the
        // spatial QC feature spec so the gene/UMI-count embeddings match those plots.
        reverse: (config.colour.gradient === 'spectral') !== Boolean(config.colour.reverseCbar),
      },
    ],
    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config?.axes.defaultValues?.includes('x') ? `${method.toUpperCase()}1` : config?.axes.xAxisText,
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
        ticks: config?.axes.xAxisLabels === false ? false : undefined,
        labels: config?.axes.xAxisLabels === false ? false : undefined,
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
        title: config?.axes.defaultValues?.includes('y') ? `${method.toUpperCase()}2` : config?.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
        ticks: config?.axes.yAxisLabels === false ? false : undefined,
        labels: config?.axes.yAxisLabels === false ? false : undefined,
      },
    ],
    marks: [
      {
        type: 'symbol',
        clip: true,
        from: { data: 'plotData' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
            opacity: [
              {
                test: "inrange(datum.x, domain('x')) && inrange(datum.y, domain('y'))",
                value: 1,
              },
              { value: 0 }, // Full invisibility for points outside the range
            ],
            size: { value: config?.marker.size },
            stroke: config?.marker.outline ? {
              scale: 'color',
              field: 'value',
            } : null,
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

const filterCells = (cellSets, selectedSample) => {
  // For 'All', return null to indicate no sample filter — avoids building a 1M-entry Set
  if (selectedSample === 'All') return null;
  // Reuse the existing cellIds Set from properties rather than constructing a new one
  return cellSets.properties[selectedSample]?.cellIds ?? new Set();
};

const generateData = (
  cellSets,
  selectedSample,
  plotData,
  embeddingData,
) => {
  const filteredCells = filterCells(cellSets, selectedSample);

  // Single-pass forEach avoids chained .map()/.filter() intermediate arrays
  const cells = [];
  embeddingData.forEach((coordinates, cellId) => {
    if (coordinates === undefined) return;
    if (filteredCells !== null && !filteredCells.has(cellId)) return;
    cells.push({
      x: coordinates[0],
      y: coordinates[1],
      value: plotData[cellId],
    });
  });

  return cells;
};

export {
  generateSpec,
  generateData,
};
