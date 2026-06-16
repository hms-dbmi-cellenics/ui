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
import useSpatialStream from './useSpatialStream';
import usePreventWheelScroll from './usePreventWheelScroll';

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
  // spectral defaults to reversed; reverseCbar flips that (XOR) — see generateSpatialFeatureSpec
  const shouldReverse = (config.colour.gradient === 'spectral') !== Boolean(config.colour.reverseCbar);
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
 *    grey (recomputed live as the threshold changes).
 * Per-sample — all the data it needs is in `plotData` ([{ cellId, value, zscore, x, y }]).
 */
const SpatialOutlierFilterPlot = (props) => {
  const {
    experimentId, sampleId, config, plotData, threshold, direction, mode, actions,
    onZoomChange, cacheId,
  } = props;

  const [plotSpec, setPlotSpec] = useState({});
  const [omeZarrUrl, setOmeZarrUrl] = useState(null);
  // undefined while probing, null = unavailable, string = available
  const [segmentationUrl, setSegmentationUrl] = useState(undefined);

  // keep the latest onZoomChange in a ref so the debounced persister always calls
  // the current callback without re-creating the debounce
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

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
        setSegmentationUrl(results?.[0]?.url ?? null);
      } catch (_e) {
        console.info('[SpatialOutlierFilterPlot] segmentations_ome_zarr_zip not available — centroid fallback');
        setSegmentationUrl(null);
      }
    })();
  }, [experimentId, sampleId]);

  const colorSignature = useMemo(() => [
    config?.colour?.gradient,
    config?.colour?.reverseCbar,
    config?.colour?.toggleInvert,
    plotData?.length,
  ].join(':'), [config?.colour, plotData]);

  // colour map + key — threshold only affects the outlier view; cacheId/mode keep
  // filters that may share the same length/colours distinct.
  const colorKey = [
    cacheId, mode, direction, mode === 'outlier' ? threshold : 'metric', colorSignature,
  ].join(':');
  const cellColorMap = useMemo(() => {
    if (!plotData?.length || !config) return null;
    return mode === 'outlier'
      ? buildOutlierCellColorMap(plotData, threshold, direction)
      : buildMetricCellColorMap(plotData, config);
    // colorKey captures mode/threshold/direction/colours/length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey, plotData]);

  // ── Viewport streaming (base + detail tiles for tissue & segmentation) ──────
  const {
    imageDims,
    segmentationsAvailable,
    segProbeDone,
    tissueImageData,
    segOverlayData,
    onViewportChange,
    ready,
  } = useSpatialStream({
    experimentId,
    sampleId,
    omeZarrUrl,
    segmentationUrl,
    plotWidth: config?.dimensions?.width,
    plotHeight: config?.dimensions?.height,
    showImage: config?.showImage ?? false,
    colorMap: cellColorMap,
    colorKey,
    opacity: (config?.marker?.opacity ?? 10) / 10,
    outline: config?.marker?.outline ?? false,
  });

  // mouse zoom/pan → persist axes range (debounced) AND stream a sharper tile.
  const persistZoom = useMemo(() => _.debounce((axesRanges) => {
    onZoomChangeRef.current(axesRanges);
  }, 250), []);
  const onZoomDomUpdate = (name, value) => {
    if (config?.miniPlot) return; // mini previews never zoom/stream — always full extent
    const [xdom, ydom] = value;
    onViewportChange(xdom, ydom);
    persistZoom({
      xAxisAuto: false,
      xMin: xdom[0],
      xMax: xdom[1],
      yAxisAuto: false,
      yMin: ydom[0],
      yMax: ydom[1],
    });
  };

  // Re-apply persisted zoom onto a freshly (re)built view + stream its detail tile.
  // Mini previews skip this entirely so they always show the zoomed-out slide, even
  // when the main plot (which shares this config's axesRanges) is zoomed in.
  const axesRangesRef = useRef(config?.axesRanges);
  axesRangesRef.current = config?.axesRanges;
  const isMiniPlot = config?.miniPlot;
  const wheelRef = usePreventWheelScroll(!isMiniPlot);
  const restoreZoom = useCallback((view) => {
    if (isMiniPlot) return;
    const ar = axesRangesRef.current;
    if (ar && ar.xAxisAuto === false) {
      view.signal('initXdom', [ar.xMin, ar.xMax]).signal('initYdom', [ar.yMin, ar.yMax]).runAsync();
      onViewportChange([ar.xMin, ar.xMax], [ar.yMin, ar.yMax]);
    } else {
      // No persisted zoom (e.g. after Reset Plot): the rebuilt view is at full extent
      // (its initXdom/initYdom signals). Tell the streamer so it re-streams the whole
      // slide — otherwise it keeps the pre-reset zoomed-in tiles and only that region
      // shows.
      onViewportChange(view.signal('initXdom'), view.signal('initYdom'));
    }
  }, [onViewportChange, isMiniPlot]);

  // ── Spec generation ─────────────────────────────────────────────────────────
  // Tiles + overlay stream in via the `data` prop — recolour (e.g. dragging the
  // threshold) and zoom update the view in place without rebuilding it.
  const specSignature = useMemo(() => {
    if (!config) return '';
    const c = { ...config, axesRanges: undefined };
    if (segmentationsAvailable && c.marker) {
      c.marker = { ...c.marker, opacity: undefined, outline: undefined };
    }
    return JSON.stringify(c);
  }, [config, segmentationsAvailable]);
  useEffect(() => {
    if (!ready || !imageDims || !segProbeDone || !config || !plotData?.length) {
      setPlotSpec({});
      return;
    }

    // Centroid-fallback data (used only when no segmentation zarr is available)
    const specData = plotData.map(({ x, y, value }) => ({ x, y, value }));

    const spec = generateSpec(
      config, EMBEDDING_TYPE, imageDims, specData, segmentationsAvailable,
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
    specSignature, plotData, mode, segmentationsAvailable, segProbeDone, imageDims, ready,
  ]);

  // tissue + overlay tiles streamed to Vega in place (no view rebuild) via `data`
  const vegaData = useMemo(() => ({
    tissueImageData,
    segOverlayData,
  }), [tissueImageData, segOverlayData]);

  if (Object.keys(plotSpec).length === 0 || !plotData?.length) {
    // Mini preview (in the plot selector): render a fixed-size empty box — no spinner
    // — so the preview tile keeps the final plot's footprint and doesn't reflow or
    // shift position as the image renders in.
    if (config?.miniPlot) {
      return (
        <div style={{ width: config.dimensions.width, height: config.dimensions.height }} />
      );
    }
    // plain spinner: this step is API/UI processing (image + overlay), not a backend
    // worker task. Red to match the app's other loaders.
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
      <div ref={wheelRef}>
        <Vega
          spec={plotSpec}
          data={vegaData}
          actions={actions}
          scaleFactor={3}
          signalListeners={{ domUpdates: onZoomDomUpdate }}
          onNewView={restoreZoom}
        />
      </div>
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
