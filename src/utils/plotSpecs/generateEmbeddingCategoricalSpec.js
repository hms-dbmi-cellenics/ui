/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { getAllCells, getSampleCells } from 'utils/cellSets';

const generateSpec = (config, plotData, cellSetLegendsData) => {
  let legend = [];

  if (config?.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';

    const legendColumns = positionIsRight ? 1 : Math.floor(config.dimensions.width / 85);
    const labelLimit = positionIsRight ? 0 : 85;

    legend = [
      {
        fill: 'cellSetLabelColors',
        title: config?.legend.title || 'Cluster Name',
        titleColor: config?.colour.masterColour,
        type: 'symbol',
        orient: config?.legend.position,
        offset: 40,
        symbolType: 'square',
        symbolSize: 200,
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
        columns: legendColumns,
        labelLimit,
      },
    ];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Categorical embedding plot',
    width: config?.dimensions.width,
    height: config?.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config?.colour.toggleInvert,
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
      },
      {
        name: 'labels',
        source: 'values',
        transform: [
          {
            type: 'aggregate', groupby: ['cellSetKey', 'cellSetName'], fields: ['x', 'y'], ops: ['mean', 'mean'], as: ['meanX', 'meanY'],
          },
        ],
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'values', field: 'x' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: { data: 'values', field: 'y' },
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
    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config?.axes.xAxisText,
        titleFont: config?.fontStyle.font,
        labelFont: config?.fontStyle.font,
        labelColor: config?.colour.masterColour,
        tickColor: config?.colour.masterColour,
        gridColor: config?.colour.masterColour,
        gridOpacity: (config?.axes.gridOpacity / 20),
        gridWidth: (config?.axes.gridWidth / 20),
        offset: config?.axes.offset,
        titleFontSize: config?.axes.titleFontSize,
        titleColor: config?.colour.masterColour,
        labelFontSize: config?.axes.labelFontSize,
        domainWidth: config?.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: config?.colour.masterColour,
        gridOpacity: (config?.axes.gridOpacity / 20),
        gridWidth: (config?.axes.gridWidth / 20),
        tickColor: config?.colour.masterColour,
        offset: config?.axes.offset,
        title: config?.axes.yAxisText,
        titleFont: config?.fontStyle.font,
        labelFont: config?.fontStyle.font,
        labelColor: config?.colour.masterColour,
        titleFontSize: config?.axes.titleFontSize,
        titleColor: config?.colour.masterColour,
        labelFontSize: config?.axes.labelFontSize,
        domainWidth: config?.axes.domainWidth,
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'values' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
            size: { value: config?.marker.size },
            stroke: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
            fill: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
            shape: { value: config?.marker.shape },
            fillOpacity: { value: config?.marker.opacity / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'labels' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'meanX' },
            y: { scale: 'y', field: 'meanY' },
            text: { field: 'cellSetName' },
            fontSize: { value: config?.labels.size },
            strokeWidth: { value: 1.2 },
            fill: { value: config?.colour.masterColour },
            fillOpacity: { value: config?.labels.enabled },
            font: { value: config?.fontStyle.font },
          },
        },
      },
    ],
    legends: legend,
    title:
    {
      text: config?.title.text,
      color: config?.colour.masterColour,
      anchor: config?.title.anchor,
      font: config?.fontStyle.font,
      dx: 10,
      fontSize: config?.title.fontSize,
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
  const clusterEnteries = cellSets.hierarchy
    .find(
      (rootNode) => rootNode.key === groupBy,
    )?.children || [];

  const cellSetKeys = clusterEnteries.map(({ key }) => key);

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

  filteredCells = filteredCells.map((cell) => {
    const inCellSet = colorToCellIdsMap.find((map) => map.cellIds.has(cell.cellId));

    // If cell is not in the cell set, then return null
    if (!inCellSet) return null;

    const { key, name, color } = inCellSet;

    if (!addedCellSetKeys.has(key)) {
      addedCellSetKeys.add(key);
      cellSetLegendsData.push({ key, name, color });
    }

    return {
      ...cell,
      cellSetKey: key,
      cellSetName: name,
      color,
    };
  });

  filteredCells = filteredCells.filter((cell) => cell !== null);

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

  const plotData = filteredCells
    .filter((d) => d.cellId < embeddingData.length)
    .filter((data) => embeddingData[data.cellId]) // filter out cells removed in data processing
    .map((data) => {
      const { cellId, ...supportingData } = data;

      return {
        ...supportingData,
        x: embeddingData[cellId][0],
        y: embeddingData[cellId][1],
      };
    });

  return { plotData: _.shuffle(plotData), cellSetLegendsData };
};

export {
  generateSpec,
  generateData,
  filterCells,
};
