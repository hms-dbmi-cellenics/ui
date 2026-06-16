/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';
import spatialZoomSignals from 'utils/plotSpecs/spatialZoomSignals';

/**
 * @param {object}      config
 * @param {string}      method
 * @param {object}      imageData   { imageWidth, imageHeight } — level-0 full dims
 *   for the Vega scale domains. The tissue tiles themselves stream in via the
 *   `data` prop (dataset 'tissueImageData'); see useSpatialStream.
 * @param {Array}       plotData
 */
// hasSegmentation controls whether the (data-driven) segmentation overlay mark or
// the centroid-dot fallback is rendered. Both the tissue tiles and the overlay are
// supplied at runtime through the Vega `data` prop ('tissueImageData' /
// 'segOverlayData'), so streaming sharper tiles + recolouring update the view in
// place without rebuilding it.
const generateSpec = (
  config, method, imageData, plotData, hasSegmentation = false,
) => {
  const { imageWidth, imageHeight } = imageData;

  // Initial zoom/pan domains are ALWAYS the full image extent — the spec is
  // intentionally invariant to config.axesRanges so that persisting a zoom never
  // changes the spec CONTENT (react-vega's VegaEmbed rebuilds the view on an
  // expensive spec change), which would flicker the slide. The persisted zoom
  // (config.axesRanges) is re-applied imperatively after (re)build via the plot's
  // onNewView (restoreZoom), by setting the initXdom/initYdom signals.
  const initXdom = [0, imageWidth];
  const initYdom = [0, imageHeight];

  let plotWidth = config.dimensions.width;
  let plotHeight = config.dimensions.height;

  // Mini previews live in a fixed square tile. Fit the plot to the slide's aspect
  // within that square (≤ box in both dimensions) so the whole image is visible —
  // never taller than the tile and clipped at the bottom.
  if (config.miniPlot && imageWidth && imageHeight) {
    const box = Math.min(plotWidth, plotHeight);
    const aspect = imageWidth / imageHeight;
    if (aspect >= 1) {
      plotWidth = box;
      plotHeight = Math.round(box / aspect);
    } else {
      plotHeight = box;
      plotWidth = Math.round(box * aspect);
    }
  }

  let legend = [];

  if (config.legend.enabled) {
    legend = [{
      fill: 'color',
      type: 'gradient',
      orient: config.legend.position,
      direction: ['left', 'right'].includes(config.legend.position) ? 'vertical' : 'horizontal',
      title: config.shownGene,
      labelColor: config.colour.masterColour,
      titleColor: config.colour.masterColour,
      titleFontSize: config.legend.titleFontSize,
      labelFontSize: config.legend.labelFontSize,
      symbolType: 'circle',
      symbolSize: 100,
      offset: 40,
    }];
  }

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
  // positions itself from its own extent, so streaming sharper tiles in is an
  // in-place data update — never a view rebuild.
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
    // 2b. Centroid dots — permanent fallback when no segmentation zarr available
    marks.push({
      type: 'symbol',
      clip: true,
      from: { data: 'plotData' },
      encode: {
        update: {
          x: { scale: 'x', field: 'x' },
          y: { scale: 'y', field: 'flipped_y' },
          size: [{ value: config?.marker.size }],
          stroke: config?.marker.outline ? { scale: 'color', field: 'value' } : null,
          fill: { scale: 'color', field: 'value' },
          shape: { value: config?.marker.shape },
          fillOpacity: { value: config.marker.opacity / 10 },
        },
      },
    });
  }

  const axes = [];

  // Mini previews render just the image + overlay (no axes/padding) so the whole
  // thumbnail fits the fixed 92×92 tile exactly — matching the histogram preview,
  // with no size snap and no clipping.
  if (!config.miniPlot && config.axes.xAxisLabels) {
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

  if (!config.miniPlot && config.axes.yAxisLabels) {
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
    description: 'Continuous embedding plot',
    width: plotWidth,
    height: plotHeight,
    autosize: { type: 'none' },
    background: config.colour.toggleInvert,
    padding,
    data: [
      {
        name: 'plotData',
        values: plotData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: { type: 'json', copy: true },
        transform: [
          {
            type: 'formula',
            as: 'flipped_y',
            expr: `${imageHeight} - datum.y`,
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
      initXdom, initYdom, [0, imageWidth], [0, imageHeight], !config.miniPlot,
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
        name: 'color',
        type: 'linear',
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
            : config.colour.gradient,
          count: 5,
        },
        domain: { data: 'plotData', field: 'value' },
        // spectral defaults to reversed; reverseCbar flips that (XOR), so an explicit
        // reverseCbar actually reverses instead of being a no-op on spectral.
        reverse: (config.colour.gradient === 'spectral') !== Boolean(config.colour.reverseCbar),
      },
    ],
    axes,
    marks,
    legends: legend,
    // Omit the title on mini previews — an (even empty) title reserves a line of
    // vertical space, pushing the canvas taller than the fixed square tile and
    // clipping the slide at the bottom.
    title: config.miniPlot ? undefined : {
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
  let filteredCells = [];

  if (selectedSample === 'All') {
    filteredCells = getAllCells(cellSets);
  } else {
    filteredCells = getSampleCells(cellSets, selectedSample);
  }

  return new Set(filteredCells.map((cell) => cell.cellId));
};

const generateData = (cellSets, selectedSample, plotData, embeddingData) => {
  const filteredCells = filterCells(cellSets, selectedSample);

  return embeddingData
    .map((coordinates, cellId) => ({ cellId, coordinates }))
    .filter(({ coordinates }) => coordinates !== undefined)
    .filter(({ cellId }) => filteredCells.has(cellId))
    .map(({ cellId, coordinates }) => ({
      x: coordinates[0],
      y: coordinates[1],
      value: plotData[cellId],
    }));
};

export { generateSpec, generateData, filterCells };
