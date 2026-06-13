import React, {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import * as vega from 'vega';
import 'vega-webgl-renderer';
import _ from 'lodash';

import { Spin } from 'antd';
import colors from 'utils/styling/colors';
import { generateSpec } from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import {
  colorSegmentationOverlay, releaseOverlay, getOverlaySnapshot, cacheOverlaySnapshot,
} from './loadSegmentationOverlay';
import {
  loadFullImage, loadSegmentationBitmask, peekFullImage, peekBitmask,
} from './spatialTileCache';

const EMBEDDING_TYPE = 'images';
// 3-element colours (no baked alpha) so colorSegmentationOverlay applies the
// opacity slider to BOTH outliers and non-outliers at the same opacity.
const OUTLIER_COLOR = [255, 0, 0]; // red
const KEPT_COLOR = [211, 211, 211]; // light grey

const isOutlier = (zscore, threshold, direction) => (
  direction === 'upper' ? zscore > threshold : zscore < -threshold
);

// Build Map<cellId, [r,g,b]> for the outlier plot: outliers red, everything else
// grey — both rendered at the slider opacity.
const buildOutlierCellColorMap = (plotData, threshold, direction) => {
  const map = new Map();
  (plotData || []).forEach(({ cellId, zscore }) => {
    if (zscore === undefined || zscore === null) return;
    map.set(cellId, isOutlier(zscore, threshold, direction) ? OUTLIER_COLOR : KEPT_COLOR);
  });
  return map;
};

// Parse a CSS colour string returned by vega.scheme interpolators into [r, g, b].
const parseCssColor = (cssColor) => {
  if (!cssColor) return [128, 128, 128];
  const rgbMatch = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(cssColor);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
  }
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cssColor);
  if (hexMatch) {
    return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)];
  }
  return [128, 128, 128];
};

// Build Map<cellId, [r,g,b]> from the metric values, using the same colour scale
// logic as the Vega spec so the overlay matches the legend exactly.
const buildMetricCellColorMap = (plotData, config) => {
  const map = new Map();
  if (!plotData?.length) return map;

  // reduce instead of Math.min/max(...array): spreading large Visium HD arrays
  // into variadic functions exhausts the call stack.
  let minVal = Infinity;
  let maxVal = -Infinity;
  plotData.forEach(({ value }) => {
    if (value === undefined || value === null) return;
    if (value < minVal) minVal = value;
    if (value > maxVal) maxVal = value;
  });
  const range = maxVal - minVal || 1;

  const schemeName = config.colour.gradient === 'default'
    ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
    : config.colour.gradient;
  const shouldReverse = config.colour.gradient === 'spectral' || config.colour.reverseCbar;
  const interpolator = vega.scheme(schemeName);
  if (typeof interpolator !== 'function') return map;

  plotData.forEach(({ cellId, value }) => {
    if (value === undefined || value === null) return;
    let t = (value - minVal) / range;
    if (shouldReverse) t = 1 - t;
    map.set(cellId, parseCssColor(interpolator(t)));
  });

  return map;
};

/**
 * Data-processing spatial filter plot. Two modes:
 *  - 'metric': tissue slide with segmentations coloured by the metric value.
 *  - 'outlier': segmentations beyond the z-score threshold filled red, the rest
 *    mostly-transparent grey (recomputed live as the threshold changes).
 * Per-sample — all the data it needs is in `plotData` ([{ cellId, value, zscore, x, y }]).
 */
const SpatialOutlierFilterPlot = (props) => {
  const {
    experimentId, sampleId, config, plotData, threshold, direction, mode, actions,
    onZoomChange, cacheId,
  } = props;

  const [plotSpec, setPlotSpec] = useState({});
  // initialise from the (synchronous) resolved caches so a remount — e.g. switching
  // between Data Processing steps — renders immediately from cache instead of
  // waiting on the signed-URL fetch + decode and flashing a redraw.
  const [currentImageData, setCurrentImageData] = useState(
    () => peekFullImage(`${experimentId}-${sampleId}-image`),
  );
  const [bitmask, setBitmask] = useState(
    () => peekBitmask(`${experimentId}-${sampleId}-seg`),
  );
  const [omeZarrUrl, setOmeZarrUrl] = useState(null);
  const [segmentationZarrUrl, setSegmentationZarrUrl] = useState(undefined);
  const [segmentationOverlay, setSegmentationOverlay] = useState(null);

  // one canvas reused for every recolour (avoids re-allocating the full-res pixel buffer)
  const overlayCanvasRef = useRef(null);
  if (!overlayCanvasRef.current && typeof document !== 'undefined') {
    overlayCanvasRef.current = document.createElement('canvas');
  }

  // keep the latest onZoomChange in a ref so the debounced persister always calls
  // the current callback without re-creating the debounce
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  // mouse zoom/pan → persist the resulting axes range into this plot's config
  // (debounced). axesRanges is excluded from the spec signature below, so writing
  // it doesn't rebuild the view; the spec re-bakes the saved range on remount.
  const persistZoom = useMemo(() => _.debounce((axesRanges) => {
    onZoomChangeRef.current(axesRanges);
  }, 250), []);
  const onZoomDomUpdate = (name, value) => {
    const [xdom, ydom] = value;
    persistZoom({
      xAxisAuto: false,
      xMin: xdom[0],
      xMax: xdom[1],
      yAxisAuto: false,
      yMin: ydom[0],
      yMax: ydom[1],
    });
  };

  // Re-apply the persisted zoom onto a freshly (re)built view (the spec always
  // inits at the full extent, so persisting a zoom never rebuilds the view). Stable
  // ref — react-vega rebuilds if onNewView changes by reference.
  const axesRangesRef = useRef(config?.axesRanges);
  axesRangesRef.current = config?.axesRanges;
  const restoreZoom = useCallback((view) => {
    const ar = axesRangesRef.current;
    if (ar && ar.xAxisAuto === false) {
      view.signal('initXdom', [ar.xMin, ar.xMax]).signal('initYdom', [ar.yMin, ar.yMax]).runAsync();
    }
  }, []);

  // ── Fetch histology image URL ──────────────────────────────────────────────
  useEffect(() => {
    if (!sampleId) return;
    (async () => {
      try {
        const results = await getSampleFileUrls(experimentId, sampleId, 'ome_zarr_zip');
        setOmeZarrUrl(results?.[0]?.url ?? null);
      } catch (e) {
        console.error('[SpatialOutlierFilterPlot] error fetching image URL:', e);
      }
    })();
  }, [experimentId, sampleId]);

  // ── Fetch segmentation URL (optional) ──────────────────────────────────────
  useEffect(() => {
    if (!sampleId) return;
    (async () => {
      try {
        const results = await getSampleFileUrls(experimentId, sampleId, 'segmentations_ome_zarr_zip');
        setSegmentationZarrUrl(results?.[0]?.url ?? null);
      } catch (_e) {
        console.info('[SpatialOutlierFilterPlot] segmentations_ome_zarr_zip not available — centroid fallback');
        setSegmentationZarrUrl(null);
      }
    })();
  }, [experimentId, sampleId]);

  const colorSignature = useMemo(() => [
    config?.colour?.gradient,
    config?.colour?.reverseCbar,
    config?.colour?.toggleInvert,
    plotData?.length,
  ].join(':'), [config?.colour, plotData]);

  // ── Load the full-resolution image once per sample (shared, cached) ─────────
  useEffect(() => {
    if (!omeZarrUrl) return;
    loadFullImage(omeZarrUrl, `${experimentId}-${sampleId}-image`).then(setCurrentImageData);
  }, [omeZarrUrl, experimentId, sampleId]);

  // ── Decode the segmentation bitmask once per sample (shared, cached) ────────
  useEffect(() => {
    if (!segmentationZarrUrl) return;
    loadSegmentationBitmask(segmentationZarrUrl, `${experimentId}-${sampleId}-seg`).then(setBitmask);
  }, [segmentationZarrUrl, experimentId, sampleId]);

  // debounced so dragging the threshold/opacity slider coalesces into one recolour.
  // Caches an immutable snapshot so a later remount can reuse it instantly.
  const recolorOverlay = useMemo(() => _.debounce((bm, colorMap, options, key) => {
    const result = colorSegmentationOverlay(bm, colorMap, options);
    if (result) {
      cacheOverlaySnapshot(key, options.canvas, result.overlayExtent);
      setSegmentationOverlay({ ...result, cached: false });
    }
  }, 120), []);

  // overlay snapshot key: cacheId (filter) + mode distinguish filters that may share
  // the same length/colours/threshold; threshold only affects the outlier view.
  const overlayCacheKey = [
    experimentId, sampleId, cacheId, mode, direction,
    mode === 'outlier' ? threshold : 'metric', colorSignature,
    config?.marker?.opacity, config?.marker?.outline,
  ].join(':');

  // Drop any stale overlay the instant we switch plot/filter (different plotData,
  // same length) or slide, so the previous filter's colouring isn't shown until this
  // plot's recolour completes. NOT keyed on threshold/opacity, so a slider drag just
  // recolours in place without blanking. MUST be defined BEFORE the recolour effect:
  // effects run in definition order, so this clears first and the recolour effect's
  // (possibly synchronous, cache-hit) set then wins — otherwise it would clobber the
  // freshly-set overlay back to null when switching metric/outlier or steps.
  useEffect(() => { setSegmentationOverlay(null); }, [plotData, mode, sampleId]);

  // ── Re-colour the overlay when the bitmask, metric/outlier mode, threshold or
  // colours change. On a cache hit (e.g. revisiting the page) reuse it instantly. ──
  useEffect(() => {
    if (!bitmask || !config || !plotData?.length) return;

    const snapshot = getOverlaySnapshot(overlayCacheKey);
    if (snapshot) {
      setSegmentationOverlay({ ...snapshot, cached: true });
      return;
    }

    const cellColorMap = mode === 'outlier'
      ? buildOutlierCellColorMap(plotData, threshold, direction)
      : buildMetricCellColorMap(plotData, config);

    const options = {
      opacity: (config.marker.opacity ?? 10) / 10,
      outline: config.marker.outline ?? false,
      canvas: overlayCanvasRef.current,
    };

    recolorOverlay(bitmask, cellColorMap, options, overlayCacheKey);
  }, [
    bitmask, plotData, colorSignature, mode, direction, threshold,
    config?.marker?.opacity, config?.marker?.outline,
  ]);

  // ── Spec generation ─────────────────────────────────────────────────────────
  // The overlay is NOT part of the spec — it streams in via the `data` prop — so
  // recolouring (e.g. dragging the threshold) updates the view in place without
  // rebuilding it or re-decoding the full-resolution tissue image.
  // a cached bitmask means segmentation is available — derive from it too so the
  // spec doesn't have to wait on the (network) segmentation-URL probe on a remount.
  const segmentationsAvailable = !!segmentationZarrUrl || !!bitmask;
  // undefined until the segmentation-availability probe resolves; render only once
  // we know, so the plot doesn't first paint centroids then swap to the overlay.
  const segProbeDone = segmentationZarrUrl !== undefined || !!bitmask;

  // Spec signature EXCLUDING axesRanges and (when segmentation is shown) the
  // overlay-only opacity/outline — so persisting mouse zoom and tweaking
  // opacity/outline never regenerate the spec and thus never rebuild the view.
  const specSignature = useMemo(() => {
    if (!config) return '';
    const c = { ...config, axesRanges: undefined };
    if (segmentationsAvailable && c.marker) {
      c.marker = { ...c.marker, opacity: undefined, outline: undefined };
    }
    return JSON.stringify(c);
  }, [config, segmentationsAvailable]);
  useEffect(() => {
    if (!currentImageData || !segProbeDone) {
      setPlotSpec({});
      return;
    }

    if (!config || !plotData?.length) {
      setPlotSpec({});
      return;
    }

    // Centroid-fallback data (used only when no segmentation zarr is available)
    const specData = plotData.map(({ x, y, value }) => ({ x, y, value }));

    const spec = generateSpec(
      config, EMBEDDING_TYPE, currentImageData, specData, segmentationsAvailable,
    );

    // The outlier view's continuous metric legend is meaningless (cells are coloured
    // red/grey client-side). Replace it with a categorical "Status" legend.
    if (mode === 'outlier') {
      const showLegend = config.legend?.enabled !== false && !config.miniPlot;
      spec.scales = [
        ...(spec.scales || []),
        {
          name: 'outlierStatus',
          type: 'ordinal',
          domain: ['kept', 'outlier'],
          range: ['rgb(211, 211, 211)', 'rgb(255, 0, 0)'],
        },
      ];
      spec.legends = showLegend ? [{
        fill: 'outlierStatus',
        type: 'symbol',
        title: config.legend?.title || 'Status',
        orient: config.legend?.position || 'right',
        direction: ['left', 'right'].includes(config.legend?.position) ? 'vertical' : 'horizontal',
        titleColor: config.colour.masterColour,
        labelColor: config.colour.masterColour,
        titleFontSize: config.legend?.titleFontSize,
        labelFontSize: config.legend?.labelFontSize,
        symbolType: 'circle',
        symbolSize: 100,
        offset: 40,
      }] : [];
    }

    setPlotSpec(spec);
  }, [
    specSignature, plotData, mode, segmentationsAvailable, segProbeDone, currentImageData,
  ]);

  // overlay image streamed to Vega in place (no view rebuild) via the `data` prop
  const vegaData = useMemo(() => ({
    segOverlayData: segmentationOverlay ? [{
      url: segmentationOverlay.overlayUrl,
      x1: segmentationOverlay.overlayExtent.xMin,
      x2: segmentationOverlay.overlayExtent.xMax,
      y1: segmentationOverlay.overlayExtent.yMin,
      y2: segmentationOverlay.overlayExtent.yMax,
    }] : [],
  }), [segmentationOverlay]);

  // release the previous overlay canvas once Vega has switched to the new one.
  // Cached snapshots are owned by the snapshot cache (LRU) — never release those.
  useEffect(() => () => {
    if (segmentationOverlay && !segmentationOverlay.cached) {
      releaseOverlay(segmentationOverlay.overlayUrl);
    }
  }, [segmentationOverlay]);

  if (Object.keys(plotSpec).length === 0 || !plotData?.length) {
    // Mini preview (in the plot selector): render a fixed-size empty box — no spinner
    // — so the preview tile keeps the final plot's footprint and doesn't reflow or
    // shift position as the image renders in.
    if (config?.miniPlot) {
      return (
        <div style={{ width: config.dimensions.width, height: config.dimensions.height }} />
      );
    }
    // plain spinner: this step is API/UI processing (image + overlay), not a
    // backend worker task, so a backend-status message would be misleading.
    // Red to match the app's other loaders.
    // same antd spinner as before, just recoloured red (like the app's Loader)
    return (
      <center style={{ padding: '2em' }}>
        <style>
          {`.spatial-loader-spinner .ant-spin-dot-item { background-color: ${colors.darkRed}; }`}
        </style>
        <Spin className='spatial-loader-spinner' size='large' />
      </center>
    );
  }

  return (
    <center>
      <Vega
        spec={plotSpec}
        data={vegaData}
        actions={actions}
        signalListeners={{ domUpdates: onZoomDomUpdate }}
        onNewView={restoreZoom}
      />
    </center>
  );
};

SpatialOutlierFilterPlot.defaultProps = {
  config: null,
  plotData: null,
  actions: true,
  threshold: 3,
  direction: 'lower',
  mode: 'metric',
  onZoomChange: () => { },
  cacheId: '',
};

SpatialOutlierFilterPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  sampleId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.array,
  cacheId: PropTypes.string,
  threshold: PropTypes.number,
  direction: PropTypes.oneOf(['lower', 'upper']),
  mode: PropTypes.oneOf(['metric', 'outlier']),
  actions: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  onZoomChange: PropTypes.func,
};

export default SpatialOutlierFilterPlot;
