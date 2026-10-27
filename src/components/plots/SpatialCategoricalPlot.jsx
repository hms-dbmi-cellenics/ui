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
import { getSpatialFileUrls, getSpatialTechnology } from 'utils/data-management/getSpatialFileUrls';
import { imagelessTechs } from 'utils/constants';
import { parseHexColor } from './loadSegmentationOverlay';
import useSpatialStream from './useSpatialStream';
import useCentroidOverlay from './useCentroidOverlay';
import usePreventWheelScroll from './usePreventWheelScroll';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

const SpatialCategoricalPlot = (props) => {
  const {
    experimentId, config, actions, onZoomChange, onSampleDefault,
  } = props;

  const dispatch = useDispatch();
  const onSampleDefaultRef = useRef(onSampleDefault);
  onSampleDefaultRef.current = onSampleDefault;

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
  const technology = useSelector(
    (state) => getSpatialTechnology(state.samples?.[sampleIdsForFileUrls?.[0]]),
  );
  const isImageless = imagelessTechs.includes(technology);

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
        // imageless techs (e.g. Xenium) have no tissue image; still register the
        // sample ids (with null urls) so the selected-sample default and the stream
        // initialise — image dimensions come from the segmentation pyramid instead.
        // An obj2s experiment's samples are the sample cell sets with segmentations.
        if (isImageless) {
          const sampleIds = isObj2s
            ? (await getSpatialFileUrls(experimentId, sampleIdsForFileUrls, 'segmentations_ome_zarr_zip', isObj2s))
              .map(({ sampleId }) => sampleId)
            : sampleIdsForFileUrls;

          setOmeZarrUrls(sampleIds.map((sampleId) => ({ url: null, sampleId })));
          return;
        }

        const results = await getSpatialFileUrls(experimentId, sampleIdsForFileUrls, 'ome_zarr_zip', isObj2s);
        setOmeZarrUrls(results.map(({ url, sampleId }) => ({ url, sampleId })));
      } catch (error) {
        console.error('Error fetching image URLs:', error);
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s, isImageless]);

  // ── Fetch segmentation URLs (optional) ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const results = await getSpatialFileUrls(experimentId, sampleIdsForFileUrls, 'segmentations_ome_zarr_zip', isObj2s);
        setSegmentationZarrUrls(results.map(({ url, sampleId }) => ({ url, sampleId })));
      } catch (_e) {
        console.info('[SpatialCategoricalPlot] segmentations_ome_zarr_zip not available — centroid fallback active');
        setSegmentationZarrUrls([]); // empty = confirmed unavailable
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  // ── Default selected sample ─────────────────────────────────────────────────
  // When the config has no (existing) sample, default to the first one AND persist it back
  // to the config, so the "Selected sample" dropdown reflects what's actually shown
  // (its own fallback uses a different ordering and would otherwise mismatch).
  useEffect(() => {
    if (!omeZarrUrls || !config) return;
    // a saved sample can be gone: rerunning obj2s gives its samples new ids
    if (omeZarrUrls.some(({ sampleId }) => sampleId === config.selectedSample)) {
      setSelectedSample(config.selectedSample);
    } else {
      const def = omeZarrUrls[0]?.sampleId;
      if (!def) return;
      setSelectedSample(def);
      onSampleDefaultRef.current(def);
    }
  }, [config, omeZarrUrls]);

  // ── Stable colour-scheme signature ─────────────────────────────────────────
  const colorSignature = useMemo(() => {
    if (!config?.selectedCellSet || !cellSets.accessible) return '';
    const group = cellSets.hierarchy.find((n) => n.key === config.selectedCellSet);
    if (!group) return '';
    return [selectedSample, config.selectedCellSet, group.children
      .map(({ key }) => `${key}:${cellSets.properties[key]?.color}`)
      .join('|')].join('::');
  }, [selectedSample, config?.selectedCellSet, cellSets.hierarchy, cellSets.properties]);

  // ── Overlay colour map (per-cell, segmentations or centroid dots) ──────────
  const cellColorMap = useMemo(() => {
    if (!cellSets.accessible
      || !config?.selectedCellSet || !selectedSample) {
      return null;
    }
    const { filteredCells } = filterCells(cellSets, selectedSample, config.selectedCellSet);
    return new Map(
      Object.entries(filteredCells).map(([cellIdStr, { color }]) => [
        parseInt(cellIdStr, 10),
        parseHexColor(color),
      ]),
    );
    // colorSignature already captures sample/cell-set/colours
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorSignature, cellSets.accessible]);

  // ── Viewport streaming (base + detail tiles for tissue & segmentation) ──────
  const segEntry = useMemo(
    () => segmentationZarrUrls?.find(({ sampleId }) => sampleId === selectedSample),
    [segmentationZarrUrls, selectedSample],
  );
  const imageEntry = useMemo(
    () => omeZarrUrls?.find(({ sampleId }) => sampleId === selectedSample),
    [omeZarrUrls, selectedSample],
  );
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

  // no segmentations: centroid dots, drawn into one image so zooming stays fast
  const centroidOverlayData = useCentroidOverlay({
    enabled: segProbeDone && !segmentationsAvailable,
    embeddingData,
    colorMap: cellColorMap,
    imageDims,
    opacity: (config?.marker?.opacity ?? 10) / 10,
    markerSize: config?.marker?.size,
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
  // Mini previews skip this so they always show the zoomed-out slide, even though
  // they share the main plot's axesRanges.
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
  // Tiles + overlay stream in via the `data` prop — recolour/zoom never rebuild.
  const specSignature = useMemo(() => {
    if (!config) return '';
    const c = { ...config, axesRanges: undefined };
    if (c.marker) {
      c.marker = {
        ...c.marker, opacity: undefined, outline: undefined, size: undefined,
      };
    }
    return JSON.stringify(c);
  }, [config]);
  useEffect(() => {
    if (!ready || !imageDims || !segProbeDone) {
      setPlotSpec({});
      return;
    }

    if (config && cellSets.accessible && embeddingData?.length && selectedSample) {
      const { plotData, cellSetLegendsData } = generateData(
        cellSets, selectedSample, config.selectedCellSet, embeddingData,
      );

      setPlotSpec(generateSpec(
        config,
        EMBEDDING_TYPE,
        imageDims,
        plotData,
        cellSetLegendsData,
        // segmentations or centroid dots, both drawn as an overlay image
        true,
      ));
    }
  }, [
    specSignature, cellSets, embeddingData, selectedSample,
    segmentationsAvailable, segProbeDone, imageDims, ready,
  ]);

  // tissue + overlay tiles streamed to Vega in place (no view rebuild) via `data`
  const vegaData = useMemo(() => ({
    tissueImageData,
    segOverlayData: centroidOverlayData ?? segOverlayData,
  }), [tissueImageData, segOverlayData, centroidOverlayData]);

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

  return <>{render()}</>;
};

SpatialCategoricalPlot.defaultProps = {
  config: null,
  actions: true,
  onZoomChange: () => { },
  onSampleDefault: () => { },
};

SpatialCategoricalPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  actions: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  onZoomChange: PropTypes.func,
  onSampleDefault: PropTypes.func,
};

export default SpatialCategoricalPlot;
