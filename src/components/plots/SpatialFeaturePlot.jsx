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
import useSpatialStream from './useSpatialStream';
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

  // spectral defaults to reversed; reverseCbar flips that (XOR) — see generateSpatialFeatureSpec
  const shouldReverse = (config.colour.gradient === 'spectral') !== Boolean(config.colour.reverseCbar);
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
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);
  const [segmentationZarrUrls, setSegmentationZarrUrls] = useState(null);
  const [selectedSample, setSelectedSample] = useState();

  // keep the latest onZoomChange in a ref so the debounced persister always calls
  // the current callback without re-creating the debounce
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

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

  // ── Colour signature ────────────────────────────────────────────────────────
  // Changes when the gene, truncation, colour scheme, or sample changes.
  const colorSignature = useMemo(() => {
    if (!config || !plotData) return '';
    return [
      selectedSample,
      config.shownGene,
      config.truncatedValues,
      config.colour.gradient,
      config.colour.reverseCbar,
      config.colour.toggleInvert,
      plotData.length,
    ].join(':');
  }, [
    selectedSample,
    config?.shownGene,
    config?.truncatedValues,
    config?.colour?.gradient,
    config?.colour?.reverseCbar,
    config?.colour?.toggleInvert,
    plotData,
  ]);

  // ── Segmentation overlay colour map (per-cell), recomputed on colour change ──
  const segmentationsAvailableGuess = segmentationZarrUrls?.length > 0;
  const cellColorMap = useMemo(() => {
    if (!segmentationsAvailableGuess || !config || !plotData?.length
      || !cellSets.accessible || !embeddingData?.length || !selectedSample) {
      return null;
    }
    const filteredCellIds = filterCells(cellSets, selectedSample);
    const activeData = config.truncatedValues ? truncatedPlotData : plotData;
    return buildFeatureCellColorMap(filteredCellIds, activeData, embeddingData, config);
    // colorSignature already captures gene/truncation/colour/sample/length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorSignature, segmentationsAvailableGuess, cellSets.accessible, embeddingData]);

  // ── Viewport streaming (base + detail tiles for tissue & segmentation) ──────
  const segEntry = useMemo(
    () => segmentationZarrUrls?.find(({ sampleId }) => sampleId === selectedSample),
    [segmentationZarrUrls, selectedSample],
  );
  const imageEntry = useMemo(
    () => omeZarrUrls?.find(({ sampleId }) => sampleId === selectedSample),
    [omeZarrUrls, selectedSample],
  );
  // undefined while probing, null when confirmed unavailable
  const segmentationUrl = segmentationZarrUrls === null
    ? undefined
    : (segEntry?.url ?? null);

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
    sampleId: selectedSample,
    omeZarrUrl: imageEntry?.url ?? null,
    segmentationUrl,
    plotWidth: config?.dimensions?.width,
    plotHeight: config?.dimensions?.height,
    showImage: config?.showImage ?? true,
    colorMap: cellColorMap,
    colorKey: colorSignature,
    opacity: (config?.marker?.opacity ?? 10) / 10,
    outline: config?.marker?.outline ?? false,
  });

  // mouse zoom/pan → persist the resulting axes range into the plot config
  // (debounced) so zoom survives navigation/sessions, AND stream a sharper viewport
  // tile. axesRanges is excluded from the spec signature below, so writing it does
  // NOT rebuild the view.
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

  // Re-apply the persisted zoom onto a freshly (re)built view, and stream the
  // detail tile for that restored viewport. Mini previews skip this so they always
  // show the zoomed-out slide, even though they share the main plot's axesRanges.
  const axesRangesRef = useRef(config?.axesRanges);
  axesRangesRef.current = config?.axesRanges;
  const isMiniPlot = config?.miniPlot;
  const restoreZoom = useCallback((view) => {
    if (isMiniPlot) return;
    const ar = axesRangesRef.current;
    if (ar && ar.xAxisAuto === false) {
      view.signal('initXdom', [ar.xMin, ar.xMax]).signal('initYdom', [ar.yMin, ar.yMax]).runAsync();
      onViewportChange([ar.xMin, ar.xMax], [ar.yMin, ar.yMax]);
    }
  }, [onViewportChange, isMiniPlot]);

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
  // Tiles + overlay are NOT part of the spec — they stream in via the `data` prop —
  // so zoom/recolour update the view in place without rebuilding it.

  // Spec signature EXCLUDING axesRanges and (when segmentation is shown) the
  // overlay-only opacity/outline — so persisting mouse zoom into axesRanges and
  // tweaking opacity/outline never regenerate the spec and thus never rebuild the
  // view. Genuine changes (gene, gradient, dimensions, sample, …) still respec.
  const specSignature = useMemo(() => {
    if (!config) return '';
    const c = { ...config, axesRanges: undefined };
    if (segmentationsAvailable && c.marker) {
      c.marker = { ...c.marker, opacity: undefined, outline: undefined };
    }
    return JSON.stringify(c);
  }, [config, segmentationsAvailable]);
  useEffect(() => {
    // Image dims not ready / segmentation availability not yet known → loader
    if (!ready || !imageDims || !segProbeDone) {
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

      setPlotSpec(generateSpec(
        config, EMBEDDING_TYPE, imageDims, specData, segmentationsAvailable,
      ));
    }
  }, [
    specSignature, plotData, embeddingData, cellSets, embeddingLoading,
    selectedSample, segmentationsAvailable, segProbeDone, imageDims, ready,
  ]);

  // tissue + overlay tiles streamed to Vega in place (no view rebuild) via `data`
  const vegaData = useMemo(() => ({
    tissueImageData,
    segOverlayData,
  }), [tissueImageData, segOverlayData]);

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
