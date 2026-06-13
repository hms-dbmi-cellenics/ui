/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';
import spatialZoomSignals from 'utils/plotSpecs/spatialZoomSignals';

/**
 * @param {object}      config
 * @param {string}      method
 * @param {object}      imageData   { imageUrl, imageWidth, imageHeight, imageExtent }
 * @param {Array}       plotData
 * @param {object|null} segmentationOverlay  { overlayUrl, overlayExtent } | null
 */
// hasSegmentation controls whether the (data-driven) segmentation overlay mark or
// the centroid-dot fallback is rendered. The overlay image itself is supplied at
// runtime through the Vega `data` prop (dataset 'segOverlayData'), so recolouring
// updates the view in place without rebuilding it (and without re-decoding the
// full-resolution tissue image).
const generateSpec = (
  config, method, imageData, plotData, hasSegmentation = false,
) => {
  const {
    imageUrl, imageWidth, imageHeight, imageExtent,
  } = imageData;

  // Initial zoom/pan domains are ALWAYS the full image extent — the spec is
  // intentionally invariant to config.axesRanges so that persisting a zoom (which
  // re-renders with a fresh plotData reference) never produces a different spec and
  // thus never rebuilds the view (which would flicker the slide). The persisted
  // zoom (config.axesRanges) is re-applied imperatively after (re)build via the
  // plot's onNewView, by setting the initXdom/initYdom signals.
  const initXdom = [0, imageWidth];
  const initYdom = [0, imageHeight];

  const plotWidth = config.dimensions.width;
  const plotHeight = config.dimensions.height;

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

  // 1. Tissue image
  if (config.showImage) {
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
          y: { signal: `scale("y", ${iy2})` },
          width: { signal: `scale("x", ${ix2}) - scale("x", ${ix1})` },
          height: { signal: `scale("y", ${iy1}) - scale("y", ${iy2})` },
          aspect: { value: false },
          opacity: { value: 1 },
        },
      },
    });
  }

  // 2a. Segmentation overlay — data-driven (image supplied via the `data` prop)
  // so recolouring is an in-place dataset update, not a view rebuild.
  if (hasSegmentation) {
    marks.push({
      type: 'image',
      clip: true,
      from: { data: 'segOverlayData' },
      encode: {
        update: {
          url: { field: 'url' },
          x: { signal: "scale('x', datum.x1)" },
          y: { signal: "scale('y', datum.y2)" },
          width: { signal: "scale('x', datum.x2) - scale('x', datum.x1)" },
          height: { signal: "scale('y', datum.y1) - scale('y', datum.y2)" },
          aspect: { value: false },
          opacity: { value: 1 },
        },
      },
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
    description: 'Continuous embedding plot',
    width: plotWidth,
    height: plotHeight,
    // resize:false — the plot/legend layout stays fixed during zoom/pan
    // (resize:true re-fits the view each frame, making the legend bounce)
    autosize: { type: 'pad', resize: false },
    background: config.colour.toggleInvert,
    // no padding for mini previews so the image fills the 92×92 tile exactly
    padding: config.miniPlot ? 0 : 5,
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
      // segmentation overlay image ({ url, x1, x2, y1, y2 }), supplied/updated
      // in place via the react-vega `data` prop
      { name: 'segOverlayData', values: [] },
    ],
    // clamp zoom/pan to the full image extent so you can always zoom back out to it
    signals: spatialZoomSignals(initXdom, initYdom, [0, imageWidth], [0, imageHeight]),
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
        reverse: config.colour.gradient === 'spectral' || config.colour.reverseCbar,
      },
    ],
    axes,
    marks,
    legends: legend,
    title: {
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
