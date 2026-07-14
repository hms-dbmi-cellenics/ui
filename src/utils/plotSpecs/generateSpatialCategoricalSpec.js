/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';
import _ from 'lodash';
import spatialZoomSignals from 'utils/plotSpecs/spatialZoomSignals';

const paddingSize = 5;

/**
 * @param {object}      config
 * @param {string}      method
 * @param {object}      imageData          { imageWidth, imageHeight } — level-0 full
 *   dims for the Vega scale domains. The tissue tiles stream in via the `data` prop
 *   (dataset 'tissueImageData'); see useSpatialStream.
 * @param {Array}       plotData
 * @param {Array}       cellSetLegendsData
 */
// hasSegmentation chooses the (data-driven) overlay mark vs the centroid fallback.
// Both tissue tiles and the overlay are supplied at runtime via the Vega `data`
// prop ('tissueImageData' / 'segOverlayData') so streaming sharper tiles +
// recolouring update the view in place — no rebuild.
const generateSpec = (
  config,
  method,
  imageData,
  plotData,
  cellSetLegendsData,
  hasSegmentation = false,
) => {
  const { imageWidth, imageHeight } = imageData;

  // Original (pre-pad) tissue extent. Images are padded (right + bottom) to a
  // common size across samples for the multi-sample grid; here (single-sample)
  // we cap the view to the tissue so the blank padding isn't shown. Falls back
  // to the full padded extent when originalSize is absent (un-padded images) —
  // then the domains below reduce to the previous [0, imageWidth/Height].
  // The y-flip (imageHeight - y) stays anchored to the padded imageHeight, so
  // tissue (top-left in data space) maps to the TOP of the flipped y-range.
  const contentWidth = imageData.origWidth ?? imageWidth;
  const contentHeight = imageData.origHeight ?? imageHeight;

  // Initial zoom/pan domains are ALWAYS the full image extent — the spec is
  // intentionally invariant to config.axesRanges so persisting a zoom never changes
  // the spec CONTENT (react-vega's VegaEmbed rebuilds on an expensive spec change),
  // which would flicker the slide. The persisted zoom (config.axesRanges) is
  // re-applied imperatively after (re)build via the plot's onNewView (restoreZoom).
  const initXdom = [0, contentWidth];
  const initYdom = [imageHeight - contentHeight, imageHeight];

  // Plot size always matches the containing box (config.dimensions) — the styling
  // panel for the full plot, the fixed mini-preview tile (MiniPlot) for previews.
  // The full image extent is mapped into that box via the x/y scale domains.
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
      titleFontSize: config?.legend.titleFontSize,
      labelFontSize: config?.legend.labelFontSize,
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

  // Tile image marks (tissue + segmentation) share this encoding. Edges are SNAPPED
  // to integer device pixels with round() so adjacent tiles share the exact same edge
  // pixel — no sub-pixel blank seam between tiles, and no overlap either.
  const tileEncode = {
    url: { field: 'url' },
    x: { signal: 'round(scale("x", datum.x1))' },
    y: { signal: 'round(scale("y", datum.y2))' },
    width: { signal: 'round(scale("x", datum.x2)) - round(scale("x", datum.x1))' },
    height: { signal: 'round(scale("y", datum.y1)) - round(scale("y", datum.y2))' },
    aspect: { value: false },
    opacity: { value: 1 },
  };

  // 1. Tissue image — data-driven (tiles supplied via the `data` prop). Each datum
  // positions itself from its own extent (negative height → vertical flip to match
  // the y-up plot), so streaming sharper tiles in is an in-place data update.
  if (config.showImage) {
    marks.push({
      type: 'image',
      clip: true,
      from: { data: 'tissueImageData' },
      encode: { update: tileEncode },
    });
  }

  // 2a. Segmentation overlay — data-driven (image supplied via the `data` prop)
  // so recolouring is an in-place dataset update, not a view rebuild.
  if (hasSegmentation) {
    marks.push({
      type: 'image',
      clip: true,
      from: { data: 'segOverlayData' },
      encode: { update: tileEncode },
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
      // draw the axis (and its grid) above the tissue image and overlay
      zindex: 1,
      domain: true,
      orient: 'bottom',
      // keep edge labels within the axis range so a tick label entering/leaving the
      // plot edge during pan/zoom doesn't change the padding (and bob the plot)
      labelBound: true,
      labelFlush: true,
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
    });
  }

  if (config.axes.yAxisLabels) {
    axes.push({
      scale: 'y',
      // horizontal gridlines (companion to the x-axis vertical gridlines)
      grid: true,
      // draw the axis (and its grid) above the tissue image and overlay
      zindex: 1,
      domain: true,
      orient: 'left',
      // keep edge labels within the axis range so a tick label entering/leaving the
      // plot edge during pan/zoom doesn't change the padding (and bob the plot)
      labelBound: true,
      labelFlush: true,
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

  // FIXED padding + autosize:'none' so the data rectangle (= width x height) never
  // changes. With 'pad'/'fit' Vega re-measures axis labels every render, so a tick
  // label entering/leaving during zoom resizes the data rect and bobs the image.
  // Here we reserve constant room for the axes/title/legend instead.
  const legendPos = config.legend.enabled ? config.legend.position : null;
  const padding = config.miniPlot ? 0 : {
    left: (config.axes.yAxisLabels ? 54 : 8) + (legendPos === 'left' ? 150 : 0),
    right: 8 + (legendPos && !['left', 'top', 'bottom'].includes(legendPos) ? 150 : 0),
    top: (config.title?.text ? 28 : 8) + (legendPos === 'top' ? 56 : 0),
    bottom: (config.axes.xAxisLabels ? (config.axes.xAxisRotateLabels ? 58 : 34) : 8)
      + (legendPos === 'bottom' ? 64 : 0),
  };

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Spatial categorical embedding plot',
    width: plotWidth,
    height: plotHeight,
    autosize: { type: 'none' },
    background: config.colour.toggleInvert,
    padding,
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
      // tissue + segmentation tiles ([{ url, x1, x2, y1, y2 }, …]), supplied/updated
      // in place via the react-vega `data` prop
      { name: 'tissueImageData', values: [] },
      { name: 'segOverlayData', values: [] },
    ],
    // clamp zoom/pan to the full image extent so you can always zoom back out to it
    signals: spatialZoomSignals(
      initXdom, initYdom, initXdom, initYdom, !config.miniPlot,
    ),
    scales: [
      {
        name: 'x',
        type: 'linear',
        nice: false,
        zero: false,
        domain: { signal: 'xdom' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        nice: false,
        zero: false,
        domain: { signal: 'ydom' },
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
    // Omit the title on mini previews — an (even empty) title reserves a line of
    // vertical space, pushing the canvas taller than the fixed square tile and
    // clipping the slide at the bottom.
    title: config.miniPlot ? undefined : {
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
