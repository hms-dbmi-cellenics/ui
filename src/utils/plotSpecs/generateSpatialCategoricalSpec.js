/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';
import _ from 'lodash';

const paddingSize = 5;

/**
 * @param {object}      config
 * @param {string}      method
 * @param {object}      imageData          { imageUrl, imageWidth, imageHeight }
 * @param {Array}       plotData
 * @param {Array}       cellSetLegendsData
 * @param {object|null} segmentationOverlay
 *   When provided: { overlayUrl, overlayWidth, overlayHeight }
 *   When null:     centroid dot symbols are rendered instead.
 */
const generateSpec = (
  config,
  method,
  imageData,
  plotData,
  cellSetLegendsData,
  segmentationOverlay = null,
) => {
  const { imageWidth, imageHeight } = imageData;

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
    const colorSymbolSize = 30;
    const characterSizeHorizontal = 5.5;
    const characterSizeVertical = 11;
    const xTickSize = 140;

    const maxLegendItemsPerCol = Math.floor(
      (config.dimensions.height - xTickSize - (2 * paddingSize)) / characterSizeVertical,
    );
    const legendSize = colorSymbolSize + _.max(
      cellSetLegendsData.map((legendData) => legendData.name.length * characterSizeHorizontal),
    );
    const legendColumns = positionIsRight
      ? Math.ceil(cellSetLegendsData.length / maxLegendItemsPerCol)
      : Math.floor(config.dimensions.width / legendSize);
    const labelLimit = positionIsRight ? 0 : legendSize;

    legend = [{
      fill: 'cellSetLabelColors',
      title: config?.legend.title === '' ? null : (config?.legend.title || 'Cluster Name'),
      titleColor: config?.colour.masterColour,
      type: 'symbol',
      orient: config?.legend.position,
      offset: 40,
      symbolType: 'circle',
      symbolSize: 100,
      encode: {
        labels: {
          update: {
            text: { scale: 'sampleToName', field: 'label' },
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
    }];
  }

  // ── Marks ───────────────────────────────────────────────────────────────────
  // Rendering order (bottom → top):
  //   1. Tissue image          (optional, config.showImage)
  //   2a. Segmentation overlay (when segmentationOverlay is available)
  //   2b. Centroid dots        (fallback when no overlay)
  //   3. Cluster labels        (optional, config.labels.enabled)
  //   4. Label background rect (optional, config.labels.enabled)
  const marks = [];

  // 1. Tissue image — positioned using imageExtent so the cropped PNG aligns
  //    correctly regardless of which pyramid level was loaded.
  if (config.showImage) {
    const { imageUrl, imageExtent } = imageData;
    const {
      xMin: ix1, xMax: ix2, yMin: iy1, yMax: iy2,
    } = imageExtent;
    marks.push({
      type: 'image',
      clip: true,
      encode: {
        update: {
          url: { value: imageUrl },
          x: { signal: `scale("x", ${ix1})` },
          y: { signal: `scale("y", ${iy2})` }, // anchor at data yMax
          width: { signal: `scale("x", ${ix2}) - scale("x", ${ix1})` },
          height: { signal: `scale("y", ${iy1}) - scale("y", ${iy2})` }, // negative → flip
          aspect: { value: false },
          opacity: { value: 1 },
        },
      },
    });
  }

  // 2a. Segmentation overlay — positioned using its exact data-space extent
  if (segmentationOverlay) {
    const { overlayUrl, overlayExtent } = segmentationOverlay;
    const {
      xMin: ox1, xMax: ox2, yMin: oy1, yMax: oy2,
    } = overlayExtent;

    // The Vega y-scale maps data-y=0 to screen-top and data-y=imageHeight to
    // screen-bottom. A negative height flips the image vertically so that zarr
    // row 0 (top of the physical image = high data-y) appears at the top of the
    // displayed region, matching the tissue image orientation.
    marks.push({
      type: 'image',
      clip: true,
      encode: {
        update: {
          url: { value: overlayUrl },
          x: { signal: `scale("x", ${ox1})` },
          y: { signal: `scale("y", ${oy2})` }, // data yMax → anchor point
          width: { signal: `scale("x", ${ox2}) - scale("x", ${ox1})` },
          height: { signal: `scale("y", ${oy1}) - scale("y", ${oy2})` }, // negative → flip
          aspect: { value: false },
          opacity: { value: 1 },
        },
      },
    });
  } else {
    // 2b. Centroid dots — permanent fallback when no segmentation zarr is available
    marks.push({
      type: 'symbol',
      clip: true,
      from: { data: 'values' },
      encode: {
        update: {
          x: { scale: 'x', field: 'x' },
          y: { scale: 'y', field: 'flipped_y' },
          size: [{ value: config?.marker.size }],
          stroke: config?.marker.outline
            ? { scale: 'cellSetMarkColors', field: 'cellSetKey' }
            : null,
          fill: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
          shape: { value: config?.marker.shape },
          fillOpacity: { value: config.marker.opacity / 10 },
        },
      },
    });
  }

  // 3 + 4. Cluster labels and their background rects
  if (config?.labels.enabled) {
    marks.push({
      name: 'clusterLabels',
      type: 'text',
      clip: true,
      from: { data: 'labels' },
      zindex: 1,
      encode: {
        update: {
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
      transform: [{
        type: 'label',
        size: { signal: '[width, height]' },
        anchor: ['left', 'right', 'top', 'bottom', 'middle'],
        avoidBaseMark: false,
      }],
    });

    marks.push({
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
    });
  }

  // ── Axes ────────────────────────────────────────────────────────────────────
  const axes = [];

  if (config.axes.xAxisLabels) {
    axes.push({
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
    });
  }

  if (config.axes.yAxisLabels) {
    axes.push({
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
    });
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Spatial categorical embedding plot',
    width: plotWidth,
    height: plotHeight,
    autosize: { type: 'pad', resize: true },
    background: config.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'values',
        values: plotData,
        format: { type: 'json', copy: true },
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
            type: 'aggregate',
            groupby: ['cellSetKey', 'cellSetName'],
            fields: ['x', 'flipped_y'],
            ops: ['median', 'median'],
            as: ['medianX', 'medianY'],
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
    title: {
      text: config?.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

// ── filterCells, generateData — unchanged ──────────────────────────────────────

const filterCells = (cellSets, sampleKey, groupBy) => {
  let filteredCells = [];

  if (sampleKey === 'All') {
    filteredCells = getAllCells(cellSets, groupBy);
  } else {
    filteredCells = getSampleCells(cellSets, sampleKey);
  }

  const clusterEntries = cellSets.hierarchy
    .find((rootNode) => rootNode.key === groupBy)?.children || [];

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
    if (!inCellSet) return acc;

    const { key, name, color } = inCellSet;

    if (!addedCellSetKeys.has(key)) {
      addedCellSetKeys.add(key);
      cellSetLegendsData.push({ key, name, color });
    }

    acc[cell.cellId] = {
      ...cell, cellSetKey: key, cellSetName: name, color,
    };
    return acc;
  }, {});

  cellSetLegendsData = _.sortBy(
    cellSetLegendsData,
    ({ key }) => _.indexOf(cellSetKeys, key),
  );

  return { filteredCells, cellSetLegendsData };
};

const generateData = (cellSets, sampleKey, groupBy, embeddingData) => {
  const { filteredCells, cellSetLegendsData } = filterCells(cellSets, sampleKey, groupBy);

  const plotData = embeddingData
    .map((coordinates, cellId) => ({ cellId, coordinates }))
    .filter(({ coordinates }) => coordinates !== undefined)
    .filter(({ cellId }) => Object.hasOwn(filteredCells, cellId))
    .map(({ cellId, coordinates }) => ({
      ...filteredCells[cellId],
      x: coordinates[0],
      y: coordinates[1],
    }));

  return { plotData, cellSetLegendsData };
};

export { generateSpec, generateData, filterCells };
