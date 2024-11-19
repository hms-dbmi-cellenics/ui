/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';

const paddingSize = 5;

const generateSpec = (config, method, imageData, plotData, cellSetLegendsData) => {
  const { imageUrl, imageWidth, imageHeight } = imageData;

  const xScaleDomain = config.axesRanges.xAxisAuto
    ? [0, imageWidth]
    : [config.axesRanges.xMin, config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? [0, imageHeight]
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  const plotWidth = config.dimensions.width;
  const plotHeight = config.dimensions.height;

  let legend = [];

  if (config.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';

    // Approximate the size of each name.
    // All names can have that size or less, so can use it calculate the amount of columns
    //
    // The size of each name is calculated by getting the amount of chars in
    //  each name and multiplying by each approx char size, 5.5
    //  plus 30 for the color symbol and offset
    const colorSymbolSize = 30;
    const characterSizeHorizontal = 5.5;
    const characterSizeVertical = 11;
    const xTickSize = 140;

    const maxLegendItemsPerCol = Math.floor(
      (config.dimensions.height - xTickSize - (2 * paddingSize))
      / characterSizeVertical,
    );

    const legendSize = colorSymbolSize + _.max(
      cellSetLegendsData.map((legendData) => legendData.name.length * characterSizeHorizontal),
    );

    // only 20 rows per column if the legend is on the right
    const legendColumns = positionIsRight
      ? Math.ceil(cellSetLegendsData.length / maxLegendItemsPerCol)
      : Math.floor((config.dimensions.width) / legendSize);
    const labelLimit = positionIsRight ? 0 : legendSize;

    legend = [
      {
        fill: 'cellSetLabelColors',
        title: config?.legend.title || 'Cluster Name',
        titleColor: config?.colour.masterColour,
        type: 'symbol',
        orient: config?.legend.position,
        offset: 40,
        symbolType: 'circle',
        symbolSize: 100,
        encode: {
          labels: {
            update: {
              text: {
                scale: 'sampleToName', field: 'label',
              },
              fill: { value: config?.colour.masterColour },
            },
          },
        },
        direction: 'horizontal',
        labelFont: config?.fontStyle.font,
        titleFont: config?.fontStyle.font,
        symbolLimit: 0,
        columns: legendColumns,
        labelLimit,
      },
    ];
  }

  let marks = [{
    type: 'symbol',
    clip: true,
    from: { data: 'values' },
    encode: {
      update: {
        x: { scale: 'x', field: 'x' },
        y: { scale: 'y', field: 'flipped_y' },
        size: [
          { value: config?.marker.size },
        ],
        stroke: config?.marker.outline ? {
          scale: 'cellSetMarkColors',
          field: 'cellSetKey',
        } : null,
        fill: {
          scale: 'cellSetMarkColors',
          field: 'cellSetKey',
        },
        shape: { value: config?.marker.shape },
        fillOpacity: { value: config.marker.opacity / 10 },
      },
    },
  }];
  if (config.showImage) {
    marks = [
      {
        type: 'image',
        clip: true,
        encode: {
          update: {
            url: { value: imageUrl },
            x: { signal: 'scale("x", 1)' }, // Use scale signal directly
            y: { signal: `scale("y", ${imageHeight})` }, // Use "scale" function with y
            width: { signal: `scale("x", ${imageWidth}) - scale("x", 1)` }, // Calculate width using scale domain
            height: { signal: `scale("y", 0) - scale("y", ${imageHeight})` }, // Calculate height using scale domain
            aspect: { value: false },
            opacity: { value: 1 },
          },
        },
      },
      ...marks,

    ];
  }

  if (config?.labels.enabled) {
    marks.push(
      {
        name: 'clusterLabels',
        type: 'text',
        clip: true,
        from: { data: 'labels' },
        zindex: 1,
        encode: {
          enter: {
            x: { scale: 'x', field: 'medianX' },
            y: { scale: 'y', field: 'medianY' },
            text: { field: 'cellSetName' },
            fontSize: { value: config?.labels.size },
            strokeWidth: { value: 1.2 },
            fill: { value: config?.colour.masterColour },
            fillOpacity: { value: config?.labels.enabled },
            font: { value: config?.fontStyle.font },
          },
        },
        transform: [
          {
            type: 'label',
            size: { signal: '[width + 60, height]' },
            anchor: ['left', 'right', 'top', 'bottom', 'middle'],
            avoidBaseMark: false,
          },
        ],
      },
    );

    marks.push(
      {
        type: 'rect',
        from: { data: 'clusterLabels' },
        encode: {
          update: {
            x: { field: 'bounds.x1', offset: -2 },
            x2: { field: 'bounds.x2', offset: 2 },
            y: { field: 'bounds.y1', offset: -2 },
            y2: { field: 'bounds.y2', offset: 2 },
            fill: { value: 'white' },
            opacity: { value: 0.5 },
          },
        },
      },
    );
  }

  let axes = [];
  if (config.axes.enabled) {
    axes = [
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
        grid: false,
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
    ];
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Continuous embedding plot',
    width: plotWidth,
    height: plotHeight,
    autosize: { type: 'pad', resize: true },

    background: config.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'values',
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
            as: 'flipped_y',
            expr: `${imageHeight} - datum.y`,
          },
        ],
      },
      {
        name: 'labels',
        source: 'values',
        transform: [
          {
            type: 'aggregate', groupby: ['cellSetKey', 'cellSetName'], fields: ['x', 'flipped_y'], ops: ['median', 'median'], as: ['medianX', 'medianY'],
          },
        ],
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        nice: false,
        zero: false,
        domain: xScaleDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        nice: false,
        zero: false,
        domain: yScaleDomain,
        range: 'height',
      },
      {
        name: 'cellSetLabelColors',
        type: 'ordinal',
        range: cellSetLegendsData.map(({ color }) => color),
        domain: { data: 'values', field: 'cellSetKey' },
      },
      {
        name: 'cellSetMarkColors',
        type: 'ordinal',
        range: { data: 'values', field: 'color' },
        domain: { data: 'values', field: 'cellSetKey' },
      },
      {
        name: 'sampleToName',
        type: 'ordinal',
        range: cellSetLegendsData.map(({ name }) => name),
      },
    ],
    axes,
    marks,
    legends: legend,
    title:
    {
      text: config?.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

const filterCells = (cellSets, sampleKey, groupBy) => {
  let filteredCells = [];

  // Get all the filtered cells
  if (sampleKey === 'All') {
    filteredCells = getAllCells(cellSets, groupBy);
  } else {
    filteredCells = getSampleCells(cellSets, sampleKey);
  }

  // Get the cell set names
  const clusterEntries = cellSets.hierarchy
    .find(
      (rootNode) => rootNode.key === groupBy,
    )?.children || [];

  const cellSetKeys = clusterEntries.map(({ key }) => key);

  const colorToCellIdsMap = cellSetKeys.reduce((acc, key) => {
    acc.push({
      cellIds: cellSets.properties[key].cellIds,
      key,
      name: cellSets.properties[key].name,
      color: cellSets.properties[key].color,
    });

    return acc;
  }, []);

  let cellSetLegendsData = [];
  const addedCellSetKeys = new Set();

  filteredCells = filteredCells.reduce((acc, cell) => {
    if (!cell) return acc;

    const inCellSet = colorToCellIdsMap.find((map) => map.cellIds.has(cell.cellId));

    // If cell is not in the cell set, then return
    if (!inCellSet) return acc;

    const { key, name, color } = inCellSet;

    if (!addedCellSetKeys.has(key)) {
      addedCellSetKeys.add(key);
      cellSetLegendsData.push({ key, name, color });
    }

    acc[cell.cellId] = {
      ...cell,
      cellSetKey: key,
      cellSetName: name,
      color,
    };

    return acc;
  }, {});

  // Sort legends to show them in the order that cellSetKeys are stored
  cellSetLegendsData = _.sortBy(
    cellSetLegendsData,
    ({ key }) => _.indexOf(cellSetKeys, key),
  );

  return { filteredCells, cellSetLegendsData };
};

// Generate dynamic data from redux store
const generateData = (cellSets, sampleKey, groupBy, embeddingData) => {
  const { filteredCells, cellSetLegendsData } = filterCells(cellSets, sampleKey, groupBy);

  const plotData = embeddingData
    .map((coordinates, cellId) => ({ cellId, coordinates }))
    .filter(({ coordinates }) => coordinates !== undefined)
    .filter(({ cellId }) => Object.hasOwn(filteredCells, cellId))
    .map((data) => {
      const { cellId, coordinates } = data;

      return {
        ...filteredCells[cellId],
        x: coordinates[0],
        y: coordinates[1],
      };
    });

  return { plotData, cellSetLegendsData };
};

export {
  generateSpec,
  generateData,
  filterCells,
};
