import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import * as vega from 'vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData, filterCells } from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import loadSegmentationOverlay from './loadSegmentationOverlay';
import getImageUrls, { getImageDimensions } from './getImageUrls';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

// Parse a CSS color string returned by vega.scheme interpolators into [r, g, b].
const parseCssColor = (cssColor) => {
  if (!cssColor) return [128, 128, 128];
  const rgbMatch = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(cssColor);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
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

  // ── Load image dimensions once per sample ────────────────────────────────────
  useEffect(() => {
    if (!omeZarrUrls || !selectedSample || imageMetadata[selectedSample]) return;
    const entry = omeZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!entry) return;
    getImageDimensions(entry.url).then((dims) => {
      setImageMetadata((prev) => ({ ...prev, [selectedSample]: dims }));
    });
  }, [omeZarrUrls, selectedSample]);

  // ── Viewport ────────────────────────────────────────────────────────────────
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

  const viewportSignature = viewport
    ? `${viewport.xMin}:${viewport.xMax}:${viewport.yMin}:${viewport.yMax}:${viewport.outputWidth}:${viewport.outputHeight}`
    : '';

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

  // ── Load tissue image whenever viewport changes ───────────────────────────
  // Does not clear currentImageData first — old image stays visible while the
  // new one loads (no flicker during zoom/pan).
  useEffect(() => {
    if (!omeZarrUrls || !selectedSample || !viewport) return;
    const entry = omeZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!entry) return;
    getImageUrls(entry.url, viewport).then(setCurrentImageData);
  }, [omeZarrUrls, selectedSample, viewportSignature]);

  // ── Load segmentation overlay whenever viewport, colours, or render options change ──
  useEffect(() => {
    if (!segmentationZarrUrls?.length || !selectedSample || !cellSets.accessible || !config) return;
    if (!viewport || !embeddingData || !plotData) return;

    const segEntry = segmentationZarrUrls.find(({ sampleId }) => sampleId === selectedSample);
    if (!segEntry) return;

    const filteredCellIds = filterCells(cellSets, selectedSample);
    const activeData = config.truncatedValues ? truncatedPlotData : plotData;
    const cellColorMap = buildFeatureCellColorMap(filteredCellIds, activeData, embeddingData, config);

    const options = {
      opacity: (config.marker.opacity ?? 10) / 10,
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

      // Merge stable full dimensions with viewport-specific PNG + extent
      const imageData = { ...imageMetadata[selectedSample], ...currentImageData };

      setPlotSpec(generateSpec(config, EMBEDDING_TYPE, imageData, specData, segmentationOverlay));
    }
  }, [
    config, plotData, embeddingData, cellSets, embeddingLoading,
    selectedSample, segmentationOverlay, segmentationZarrUrls,
    currentImageData, imageMetadata,
  ]);

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
        <Vega spec={plotSpec} actions={actions} />
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
};

export default SpatialFeaturePlot;