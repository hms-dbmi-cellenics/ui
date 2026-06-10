import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData, filterCells } from 'utils/plotSpecs/generateSpatialCategoricalSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import loadSegmentationOverlay, { parseHexColor } from './loadSegmentationOverlay';
import getImageUrls, { getImageDimensions } from './getImageUrls';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

const SpatialCategoricalPlot = (props) => {
  const { experimentId, config, actions } = props;

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
  const obj2sStatusRaw = useSelector((state) => state.backendStatus[experimentId]?.status?.obj2s?.status);
  const isObj2s = obj2sStatusRaw != null && obj2sStatusRaw !== 'NOT_CREATED';

  const [plotSpec, setPlotSpec] = useState({});
  // imageMetadata: stable full level-0 dimensions per sample — fetched once
  // currentImageData: viewport-cropped PNG + extent — refetched on zoom/pan
  const [imageMetadata, setImageMetadata] = useState({});
  const [currentImageData, setCurrentImageData] = useState(null);
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);
  const [segmentationZarrUrls, setSegmentationZarrUrls] = useState(null);
  const [selectedSample, setSelectedSample] = useState();
  const [segmentationOverlay, setSegmentationOverlay] = useState(null);

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

  // ── Load image dimensions once per sample ────────────────────────────────────
  // Only reads zarr metadata — no pixel data transferred.
  useEffect(() => {
    if (!omeZarrUrls || !selectedSample || imageMetadata[selectedSample]) return;
    const entry = omeZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!entry) return;
    getImageDimensions(entry.url).then((dims) => {
      setImageMetadata((prev) => ({ ...prev, [selectedSample]: dims }));
    });
  }, [omeZarrUrls, selectedSample]);

  // ── Viewport ────────────────────────────────────────────────────────────────
  // Derived from config axes ranges + stable image dimensions.
  // null until dimensions are loaded for the selected sample.
  const viewport = useMemo(() => {
    const dims = imageMetadata[selectedSample];
    if (!config?.axesRanges || !dims) return null;
    const { xAxisAuto, yAxisAuto, xMin, xMax, yMin, yMax } = config.axesRanges;
    return {
      xMin: xAxisAuto ? 0 : xMin,
      xMax: xAxisAuto ? dims.imageWidth : xMax,
      yMin: yAxisAuto ? 0 : yMin,
      yMax: yAxisAuto ? dims.imageHeight : yMax,
      outputWidth: config.dimensions.width,
      outputHeight: config.dimensions.height,
    };
  }, [config?.axesRanges, config?.dimensions, imageMetadata, selectedSample]);

  // String key so effects can dep on it without an object reference.
  // Empty string while viewport is not yet available.
  const viewportSignature = viewport
    ? `${viewport.xMin}:${viewport.xMax}:${viewport.yMin}:${viewport.yMax}:${viewport.outputWidth}:${viewport.outputHeight}`
    : '';

  // ── Stable colour-scheme signature ─────────────────────────────────────────
  const colorSignature = useMemo(() => {
    if (!config?.selectedCellSet || !cellSets.accessible) return '';
    const group = cellSets.hierarchy.find((n) => n.key === config.selectedCellSet);
    if (!group) return '';
    return group.children
      .map(({ key }) => `${key}:${cellSets.properties[key]?.color}`)
      .join('|');
  }, [config?.selectedCellSet, cellSets.hierarchy, cellSets.properties]);

  // Changes when opacity or outline toggle changes → triggers overlay reload.
  const renderSignature = `${config?.marker?.opacity ?? 10}:${config?.marker?.outline ?? false}`;

  // ── Load tissue image whenever viewport changes ───────────────────────────
  // Does not clear currentImageData first — old image stays visible while
  // the new one loads (no flicker during zoom/pan).
  useEffect(() => {
    if (!omeZarrUrls || !selectedSample || !viewport) return;
    const entry = omeZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!entry) return;
    getImageUrls(entry.url, viewport).then(setCurrentImageData);
  }, [omeZarrUrls, selectedSample, viewportSignature]);
  // viewportSignature fires on first dims load (bootstraps initial render)
  // and again on every zoom/pan.

  // ── Load segmentation overlay whenever viewport or colours change ─────────
  useEffect(() => {
    if (!segmentationZarrUrls?.length || !selectedSample || !cellSets.accessible || !config) return;
    if (!viewport) return;

    const segEntry = segmentationZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!segEntry) return;

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
    };

    setSegmentationOverlay(null);
    loadSegmentationOverlay(segEntry.url, cellColorMap, viewport, options).then(setSegmentationOverlay);
  }, [segmentationZarrUrls, selectedSample, colorSignature, viewportSignature, renderSignature]);

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
  useEffect(() => {
    const segmentationsAvailable = segmentationZarrUrls?.length > 0;

    // Segmentations exist but overlay not ready yet → show loader
    if (segmentationsAvailable && !segmentationOverlay) {
      setPlotSpec({});
      return;
    }

    // Image not ready yet → show loader
    if (!currentImageData || !imageMetadata[selectedSample]) {
      setPlotSpec({});
      return;
    }

    if (config && cellSets.accessible && embeddingData?.length && selectedSample) {
      const { plotData, cellSetLegendsData } = generateData(
        cellSets, selectedSample, config.selectedCellSet, embeddingData,
      );

      // Merge stable full dimensions with viewport-specific PNG + extent
      const imageData = { ...imageMetadata[selectedSample], ...currentImageData };

      setPlotSpec(generateSpec(
        config,
        EMBEDDING_TYPE,
        imageData,
        plotData,
        cellSetLegendsData,
        segmentationOverlay, // null → centroid dots; object → overlay
      ));
    }
  }, [
    config, cellSets, embeddingData, selectedSample,
    segmentationOverlay, segmentationZarrUrls,
    currentImageData, imageMetadata,
  ]);

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
        <Vega spec={plotSpec} actions={actions} />
      </center>
    );
  };

  return <>{render()}</>;
};

SpatialCategoricalPlot.defaultProps = {
  config: null,
  actions: true,
};

SpatialCategoricalPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  actions: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
};

export default SpatialCategoricalPlot;