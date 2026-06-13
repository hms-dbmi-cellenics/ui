import React, {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';
import _ from 'lodash';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData, filterCells } from 'utils/plotSpecs/generateSpatialCategoricalSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import {
  parseHexColor, colorSegmentationOverlay, releaseOverlay,
  getOverlaySnapshot, cacheOverlaySnapshot,
} from './loadSegmentationOverlay';
import { loadFullImage, loadSegmentationBitmask } from './spatialTileCache';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

const SpatialCategoricalPlot = (props) => {
  const {
    experimentId, config, actions, onZoomChange,
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
      } catch (error) {
        console.error('Error fetching image URLs:', error);
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
        console.info('[SpatialCategoricalPlot] segmentations_ome_zarr_zip not available — centroid fallback active');
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
  // (debounced). axesRanges is excluded from the spec signature below, so writing
  // it doesn't rebuild the view — only the live Vega signals move; the spec
  // re-bakes the saved range on the next genuine respec / remount.
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

  // ── Stable colour-scheme signature ─────────────────────────────────────────
  const colorSignature = useMemo(() => {
    if (!config?.selectedCellSet || !cellSets.accessible) return '';
    const group = cellSets.hierarchy.find((n) => n.key === config.selectedCellSet);
    if (!group) return '';
    return group.children
      .map(({ key }) => `${key}:${cellSets.properties[key]?.color}`)
      .join('|');
  }, [config?.selectedCellSet, cellSets.hierarchy, cellSets.properties]);

  // Changes when opacity or outline toggle changes → triggers overlay recolour.
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
  // immutable snapshot so a later remount can reuse it instantly (no recolour).
  const recolorOverlay = useMemo(() => _.debounce((bm, colorMap, options, key) => {
    const result = colorSegmentationOverlay(bm, colorMap, options);
    if (result) {
      cacheOverlaySnapshot(key, options.canvas, result.overlayExtent);
      setSegmentationOverlay({ ...result, cached: false });
    }
  }, 120), []);

  // overlay snapshot key: everything that affects the painted pixels
  const overlayCacheKey = `${experimentId}:${selectedSample}:categorical:${config?.selectedCellSet}:${colorSignature}:${renderSignature}`;

  // drop any stale overlay when switching slide. MUST precede the recolour effect so
  // a cache-hit set in the recolour effect isn't clobbered back to null.
  useEffect(() => { setSegmentationOverlay(null); }, [selectedSample]);

  // ── Re-colour the overlay when the bitmask or colours change (no fetch) ──
  // On a cache hit (e.g. revisiting the page) reuse the snapshot instantly.
  useEffect(() => {
    if (!bitmask || !cellSets.accessible || !config?.selectedCellSet) return;

    const snapshot = getOverlaySnapshot(overlayCacheKey);
    if (snapshot) {
      setSegmentationOverlay({ ...snapshot, cached: true });
      return;
    }

    const { filteredCells } = filterCells(cellSets, selectedSample, config.selectedCellSet);
    const cellColorMap = new Map(
      Object.entries(filteredCells).map(([cellIdStr, { color }]) => [
        parseInt(cellIdStr, 10),
        parseHexColor(color),
      ]),
    );

    const options = {
      opacity: (config.marker.opacity ?? 10) / 10, // config scale 0–10 → 0–1
      outline: config.marker.outline ?? false,
      canvas: overlayCanvasRef.current,
    };

    recolorOverlay(bitmask, cellColorMap, options, overlayCacheKey);
  }, [bitmask, selectedSample, colorSignature, renderSignature, cellSets.accessible]);

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
  // view. Genuine changes still respec and re-bake the current zoom.
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

    if (config && cellSets.accessible && embeddingData?.length && selectedSample) {
      const { plotData, cellSetLegendsData } = generateData(
        cellSets, selectedSample, config.selectedCellSet, embeddingData,
      );

      // full-resolution image (imageUrl + level-0 dims + full extent)
      setPlotSpec(generateSpec(
        config,
        EMBEDDING_TYPE,
        currentImageData,
        plotData,
        cellSetLegendsData,
        segmentationsAvailable,
      ));
    }
  }, [
    specSignature, cellSets, embeddingData, selectedSample,
    segmentationsAvailable, segProbeDone, currentImageData,
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

  // ── Render ──────────────────────────────────────────────────────────────────
  const render = () => {
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
      || !cellSets.accessible
      || embeddingLoading
      || Object.keys(plotSpec).length === 0
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

SpatialCategoricalPlot.defaultProps = {
  config: null,
  actions: true,
  onZoomChange: () => { },
};

SpatialCategoricalPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  actions: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  onZoomChange: PropTypes.func,
};

export default SpatialCategoricalPlot;
