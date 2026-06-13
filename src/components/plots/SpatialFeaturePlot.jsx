import React, {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import * as vega from 'vega';
import 'vega-webgl-renderer';
import _ from 'lodash';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData, filterCells } from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import {
  colorSegmentationOverlay, releaseOverlay, getOverlaySnapshot, cacheOverlaySnapshot,
} from './loadSegmentationOverlay';
import { loadFullImage, loadSegmentationBitmask } from './spatialTileCache';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

// Parse a CSS color string returned by vega.scheme interpolators into [r, g, b].
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

// Build Map<cellId, [r,g,b]> from expression values, using the same colour
// scale logic as the Vega spec so the overlay matches the legend exactly.
const buildFeatureCellColorMap = (filteredCellIds, plotDataArr, embeddingData, config) => {
  const cells = [];
  embeddingData.forEach((coords, cellId) => {
    if (!filteredCellIds.has(cellId) || coords === undefined) return;
    const value = plotDataArr[cellId];
    if (value === undefined || value === null) return;
    cells.push({ cellId, value });
  });

  if (cells.length === 0) return new Map();

  // Use reduce instead of Math.min/max(...array) — spreading large arrays
  // into variadic functions exhausts the call stack.
  let minVal = Infinity;
  let maxVal = -Infinity;
  cells.forEach(({ value }) => {
    if (value < minVal) minVal = value;
    if (value > maxVal) maxVal = value;
  });
  const range = maxVal - minVal || 1;

  const schemeName = config.colour.gradient === 'default'
    ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
    : config.colour.gradient;

  const shouldReverse = config.colour.gradient === 'spectral' || config.colour.reverseCbar;
  const interpolator = vega.scheme(schemeName);

  if (typeof interpolator !== 'function') return new Map();

  const map = new Map();
  cells.forEach(({ cellId, value }) => {
    let t = (value - minVal) / range;
    if (shouldReverse) t = 1 - t;
    map.set(cellId, parseCssColor(interpolator(t)));
  });

  return map;
};

const SpatialFeaturePlot = (props) => {
  const {
    experimentId,
    config,
    plotData,
    truncatedPlotData,
    actions,
    loading,
    error,
    reloadPlotData,
    onZoomChange,
  } = props;

  const dispatch = useDispatch();

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[EMBEDDING_TYPE]) || {};

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const cellSets = useSelector(getCellSets());

  const sampleIdsForFileUrls = useSelector((state) => state.experimentSettings.info.sampleIds);
  const obj2sStatusRaw = useSelector(
    (state) => state.backendStatus[experimentId]?.status?.obj2s?.status,
  );
  const isObj2s = !_.isNil(obj2sStatusRaw) && obj2sStatusRaw !== 'NOT_CREATED';

  const [plotSpec, setPlotSpec] = useState({});
  // full-resolution (level-0) image for the sample, fetched + decoded once and
  // shared across all spatial plots via spatialTileCache
  const [currentImageData, setCurrentImageData] = useState(null);
  // decoded segmentation label bitmask (cached); coloured on demand into an overlay
  const [bitmask, setBitmask] = useState(null);
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);
  const [segmentationZarrUrls, setSegmentationZarrUrls] = useState(null);
  const [selectedSample, setSelectedSample] = useState();
  const [segmentationOverlay, setSegmentationOverlay] = useState(null);

  // keep the latest onZoomChange in a ref so the debounced persister always calls
  // the current callback without re-creating the debounce
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  // one canvas reused for every recolour (avoids re-allocating the full-res pixel buffer)
  const overlayCanvasRef = useRef(null);
  if (!overlayCanvasRef.current && typeof document !== 'undefined') {
    overlayCanvasRef.current = document.createElement('canvas');
  }

  // ── Fetch image URLs ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const results = (await Promise.all(
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'ome_zarr_zip')),
        )).flat();

        const signedUrls = results.map(({ url, fileId }, i) => ({
          url,
          sampleId: isObj2s ? fileId : sampleIdsForFileUrls[i],
        }));

        setOmeZarrUrls(signedUrls);
      } catch (e) {
        console.error('Error fetching image URLs:', e);
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  // ── Fetch segmentation URLs (optional) ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const results = (await Promise.all(
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'segmentations_ome_zarr_zip')),
        )).flat();

        const signedUrls = results.map(({ url, fileId }, i) => ({
          url,
          sampleId: isObj2s ? fileId : sampleIdsForFileUrls[i],
        }));

        setSegmentationZarrUrls(signedUrls);
      } catch (_e) {
        console.info('[SpatialFeaturePlot] segmentations_ome_zarr_zip not available — centroid fallback active');
        setSegmentationZarrUrls([]); // empty = confirmed unavailable
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  // ── Default selected sample ─────────────────────────────────────────────────
  useEffect(() => {
    if (!omeZarrUrls || !config) return;
    const sampleId = config.selectedSample || omeZarrUrls[0]?.sampleId;
    setSelectedSample(sampleId);
  }, [config, omeZarrUrls]);

  // mouse zoom/pan → persist the resulting axes range into the plot config
  // (debounced) so zoom survives navigation and sessions. axesRanges is excluded
  // from the spec signature below, so writing it does NOT rebuild the view — only
  // the live Vega signals move; the spec re-bakes the saved range on the next
  // genuine respec / remount.
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

  // Re-apply the persisted zoom onto a freshly (re)built view. The spec always
  // inits at the full extent (so persisting a zoom never rebuilds the view), so
  // this restores the saved zoom only on a genuine rebuild / initial mount. Stable
  // ref — react-vega rebuilds the view if onNewView changes — reads the latest
  // range via a ref.
  const axesRangesRef = useRef(config?.axesRanges);
  axesRangesRef.current = config?.axesRanges;
  const restoreZoom = useCallback((view) => {
    const ar = axesRangesRef.current;
    if (ar && ar.xAxisAuto === false) {
      view.signal('initXdom', [ar.xMin, ar.xMax]).signal('initYdom', [ar.yMin, ar.yMax]).runAsync();
    }
  }, []);

  // ── Colour signature ────────────────────────────────────────────────────────
  // Changes when the gene, truncation, or colour scheme changes.
  // plotData.length acts as a proxy for "data has loaded / changed".
  const colorSignature = useMemo(() => {
    if (!config || !plotData) return '';
    return [
      config.shownGene,
      config.truncatedValues,
      config.colour.gradient,
      config.colour.reverseCbar,
      config.colour.toggleInvert,
      plotData.length,
    ].join(':');
  }, [
    config?.shownGene,
    config?.truncatedValues,
    config?.colour?.gradient,
    config?.colour?.reverseCbar,
    config?.colour?.toggleInvert,
    plotData,
  ]);

  // Changes when opacity or outline toggle changes.
  const renderSignature = `${config?.marker?.opacity ?? 10}:${config?.marker?.outline ?? false}`;

  // ── Load the full-resolution image once per sample (shared, cached) ─────────
  // Zoom/pan then operates purely on the Vega scales (no refetch).
  useEffect(() => {
    if (!omeZarrUrls || !selectedSample) return;
    const entry = omeZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!entry) return;
    loadFullImage(entry.url, `${experimentId}-${selectedSample}-image`).then(setCurrentImageData);
  }, [omeZarrUrls, selectedSample, experimentId]);

  // ── Decode the segmentation bitmask once per sample (shared, cached) ────────
  useEffect(() => {
    if (!segmentationZarrUrls?.length || !selectedSample) return;
    const segEntry = segmentationZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!segEntry) return;
    loadSegmentationBitmask(segEntry.url, `${experimentId}-${selectedSample}-seg`).then(setBitmask);
  }, [segmentationZarrUrls, selectedSample, experimentId]);

  // debounced so dragging the opacity slider coalesces into one recolour. Caches an
  // immutable snapshot keyed by the colour-affecting inputs so a later remount can
  // reuse it instantly instead of recolouring.
  const recolorOverlay = useMemo(() => _.debounce((bm, colorMap, options, key) => {
    const result = colorSegmentationOverlay(bm, colorMap, options);
    if (result) {
      cacheOverlaySnapshot(key, options.canvas, result.overlayExtent);
      setSegmentationOverlay({ ...result, cached: false });
    }
  }, 120), []);

  // overlay snapshot key: everything that affects the painted pixels
  const overlayCacheKey = `${experimentId}:${selectedSample}:feature:${colorSignature}:${renderSignature}`;

  // drop any stale overlay when switching slide. MUST precede the recolour effect so
  // a cache-hit set in the recolour effect isn't clobbered back to null.
  useEffect(() => { setSegmentationOverlay(null); }, [selectedSample]);

  // ── Re-colour the overlay when the bitmask, colours, or render options change ──
  // On a cache hit (e.g. revisiting the page) reuse the snapshot instantly.
  useEffect(() => {
    if (!bitmask || !cellSets.accessible || !config || !embeddingData || !plotData) return;

    const snapshot = getOverlaySnapshot(overlayCacheKey);
    if (snapshot) {
      setSegmentationOverlay({ ...snapshot, cached: true });
      return;
    }

    const filteredCellIds = filterCells(cellSets, selectedSample);
    const activeData = config.truncatedValues ? truncatedPlotData : plotData;
    const cellColorMap = buildFeatureCellColorMap(
      filteredCellIds, activeData, embeddingData, config,
    );

    const options = {
      opacity: (config.marker.opacity ?? 10) / 10,
      outline: config.marker.outline ?? false,
      canvas: overlayCanvasRef.current,
    };

    recolorOverlay(bitmask, cellColorMap, options, overlayCacheKey);
  }, [
    bitmask, selectedSample, colorSignature, renderSignature,
    embeddingData, cellSets.accessible,
  ]);

  // ── Data loading dispatch ───────────────────────────────────────────────────
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, [omeZarrUrls]);

  useEffect(() => {
    if (!embeddingSettings) dispatch(loadProcessingSettings(experimentId));
    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE));
    }
  }, [embeddingSettings?.method]);

  // ── Spec generation ─────────────────────────────────────────────────────────
  // The overlay is NOT part of the spec — it streams in via the `data` prop — so
  // recolouring doesn't regenerate (and thus doesn't rebuild/re-decode) the plot.
  const segmentationsAvailable = segmentationZarrUrls?.length > 0;
  // null until the segmentation-availability probe resolves; render only once we
  // know, so the plot doesn't first paint centroids then swap to the overlay.
  const segProbeDone = segmentationZarrUrls !== null;

  // Spec signature EXCLUDING axesRanges and (when segmentation is shown) the
  // overlay-only opacity/outline — so persisting mouse zoom into axesRanges and
  // tweaking opacity/outline never regenerate the spec and thus never rebuild the
  // view. Genuine changes (gene, gradient, dimensions, sample, …) still respec, and
  // the spec re-bakes the current axesRanges (zoom) at that point.
  const specSignature = useMemo(() => {
    if (!config) return '';
    const c = { ...config, axesRanges: undefined };
    if (segmentationsAvailable && c.marker) {
      c.marker = { ...c.marker, opacity: undefined, outline: undefined };
    }
    return JSON.stringify(c);
  }, [config, segmentationsAvailable]);
  useEffect(() => {
    // Image not ready / segmentation availability not yet known → show loader
    if (!currentImageData || !segProbeDone) {
      setPlotSpec({});
      return;
    }

    if (
      !embeddingLoading
      && !embeddingError
      && config
      && selectedSample
      && plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length
    ) {
      const activeData = config.truncatedValues ? truncatedPlotData : plotData;
      const specData = generateData(cellSets, selectedSample, activeData, embeddingData);

      // full-resolution image (imageUrl + level-0 dims + full extent)
      setPlotSpec(generateSpec(
        config, EMBEDDING_TYPE, currentImageData, specData, segmentationsAvailable,
      ));
    }
  }, [
    specSignature, plotData, embeddingData, cellSets, embeddingLoading,
    selectedSample, segmentationsAvailable, segProbeDone, currentImageData,
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

  // release the previous overlay canvas once Vega has switched to the new one
  // (cleanup fires with the prior value when segmentationOverlay changes / unmounts).
  // Cached snapshots are owned by the snapshot cache (LRU) — never release those here.
  useEffect(() => () => {
    if (segmentationOverlay && !segmentationOverlay.cached) {
      releaseOverlay(segmentationOverlay.overlayUrl);
    }
  }, [segmentationOverlay]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { reloadPlotData(); }}
        />
      );
    }

    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => { dispatch(loadCellSets(experimentId)); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE)); }}
        />
      );
    }

    if (
      !config
      || loading
      || !cellSets.accessible
      || embeddingLoading
      || Object.keys(plotSpec).length === 0
      || !plotData?.length
    ) {
      return (
        <center>
          <Loader experimentId={experimentId} />
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

  return <>{render()}</>;
};

SpatialFeaturePlot.defaultProps = {
  reloadPlotData: () => { },
  config: null,
  plotData: null,
  truncatedPlotData: null,
  actions: true,
  onZoomChange: () => { },
};

SpatialFeaturePlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.array,
  truncatedPlotData: PropTypes.array,
  actions: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  reloadPlotData: PropTypes.func,
  onZoomChange: PropTypes.func,
};

export default SpatialFeaturePlot;
