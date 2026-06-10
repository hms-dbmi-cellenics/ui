import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import { useSelector, useDispatch } from 'react-redux';
import * as vega from 'vega';
import PropTypes from 'prop-types';
import { OrthographicView, OrthographicViewport, COORDINATE_SYSTEM } from '@deck.gl/core';
import { PolygonLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { DrawPolygonByDraggingMode } from '@nebula.gl/edit-modes';
import { MultiscaleImageLayer, getDefaultInitialViewState } from '@hms-dbmi/viv';

import BitmaskLayer from './BitmaskLayer';

import ClusterPopover from 'components/data-exploration/embedding/ClusterPopover';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import ToolMenu from 'components/data-exploration/embedding/ToolMenu';
import { buildCellsQuadTree, selectCellsInPolygon } from 'components/data-exploration/embedding/lassoUtils';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';

import { loadComponentConfig } from 'redux/actions/componentConfig';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';
import { createCellSet } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
import { updateCellInfo } from 'redux/actions/cellInfo';
import { union } from 'utils/cellSetOperations';
import _ from 'lodash';

import { root as zarrRoot } from 'zarrita';

import {
  offsetCentroids,
  renderCellSetColors,
  colorByGeneExpression,
} from 'utils/plotUtils';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';

import { loadOmeZarrGrid } from './loadOmeZarr';

const COLOR_SCHEME = 'plasma';
const colorInterpolator = vega.scheme(COLOR_SCHEME);

const COMPONENT_TYPE = 'interactiveSpatial';
const EMBEDDING_TYPE = 'images';

const BITMASK_LUT_SIZE = 2048;
const DEFAULT_CELL_GREY = 128;

const DUMMY_EXPRESSION_DATA = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE);

// Stable all-zero RGBA LUT. Alpha=0 throughout → shader discards all pixels.
// Returned by hoverFillColorLUT when nothing is hovered to avoid allocating a
// new buffer (and re-uploading the GPU texture) on every hover-clear event.
const EMPTY_COLOR_LUT = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);

const LASSO_MODE_CONFIG = { dragToDraw: true };
const EMPTY_DATA = { type: 'FeatureCollection', features: [] };
const DIAMOND_RADIUS = 5;
const POLYGON_HIGHLIGHT_COLOR = [51, 51, 51, 150];
const DEFAULT_COLOR = [128, 128, 128, 255];

// ── renderSubBitmaskLayers (module-level) ─────────────────────────────────────
function renderSubBitmaskLayers(props) {
  const {
    bbox: {
      left, top, right, bottom,
    },
    index: { x, y, z },
  } = props.tile;
  const { data, id, loader } = props;

  if ([left, bottom, right, top].some((v) => v < 0) || !data) return null;

  const base = loader[0];
  const [imgHeight, imgWidth] = base.shape.slice(-2);

  const bounds = [
    left,
    data.height < base.tileSize ? imgHeight : bottom,
    data.width < base.tileSize ? imgWidth : right,
    top,
  ];

  return new BitmaskLayer(props, {
    channelData: data,
    bounds,
    id: `sub-layer-${bounds}-${id}`,
    tileId: { x, y, z },
    tileWidth: data.width,
    tileHeight: data.height,
  });
}

const DeckGL = dynamic(() => import('@deck.gl/react').then((mod) => mod.DeckGL), { ssr: false });

const parseColor = (colorValue) => {
  if (!colorValue) return [128, 128, 128, 255];
  if (Array.isArray(colorValue)) return colorValue.length === 4 ? colorValue : [...colorValue, 255];
  if (typeof colorValue === 'string') {
    const hex = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255];
    }
  }
  return [128, 128, 128, 255];
};

const SpatialViewer = (props) => {
  const { experimentId, height, width } = props;
  const dispatch = useDispatch();

  const [activeTool, setActiveTool] = useState(null);
  const [cellsQuadTree, setCellsQuadTree] = useState(null);

  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const { data, loading, error } = useSelector((state) => state.embeddings[EMBEDDING_TYPE]) || {};

  const spatialSettings = useSelector(
    (state) => state.componentConfig[COMPONENT_TYPE]?.config,
    _.isEqual,
  ) || {};

  const focusData = useSelector((state) => state.cellInfo.focus);

  const cellSets = useSelector(getCellSets());
  const {
    properties: cellSetProperties,
    hierarchy: cellSetHierarchy,
    hidden: cellSetHidden,
  } = cellSets;

  const selectedCell = useSelector((state) => state.cellInfo.cellId);
  const expressionLoading = useSelector((state) => state.genes.expression.full.loading);
  const expressionMatrix = useSelector((state) => state.genes.expression.full.matrix);

  const sampleIdsForFileUrls = useSelector((state) => state.experimentSettings.info.sampleIds);
  const obj2sStatusRaw = useSelector((state) => state.backendStatus[experimentId]?.status?.obj2s?.status);
  const isObj2s = obj2sStatusRaw != null && obj2sStatusRaw !== 'NOT_CREATED';

  const cellCoordinatesRef = useRef({ x: 200, y: 300 });

  const [cellInfoTooltip, setCellInfoTooltip] = useState();
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [cellColors, setCellColors] = useState({});
  const [cellInfoVisible, setCellInfoVisible] = useState(true);

  const [omeZarrSampleIds, setOmeZarrSampleIds] = useState([]);
  const [omeZarrUrls, setOmeZarrUrls] = useState([]);
  const [segmentationsOmeZarrUrls, setSegmentationsOmeZarrUrls] = useState([]);
  const [loader, setLoader] = useState(null);
  const [segmentationsLoader, setSegmentationsLoader] = useState(null);
  const [offsetData, setOffsetData] = useState();
  const [perImageShape, setPerImageShape] = useState();
  const [gridShape, setGridShape] = useState();
  const [viewState, setViewState] = useState(null);
  const viewStateRef = useRef(null);
  const hoveredByPointerRef = useRef(null);

  const deckglView = useMemo(() => new OrthographicView({ id: 'spatial', controller: true }), []);

  // ── Keep viewStateRef in sync ─────────────────────────────────────────────
  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  // ── Config ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!_.isEmpty(spatialSettings)) return;
    dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  }, [spatialSettings]);

  // ── Centroid offsets ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!data || !omeZarrSampleIds.length || !cellSetProperties || !perImageShape || !gridShape) return;
    if (omeZarrSampleIds.some((id) => !cellSetProperties[id])) return;
    setOffsetData(offsetCentroids(data, cellSetProperties, omeZarrSampleIds, perImageShape, gridShape));
  }, [data, omeZarrSampleIds, cellSetProperties, perImageShape, gridShape]);

  // ── URL fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [imageResult, segResult] = await Promise.allSettled([
          Promise.all(
            sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'ome_zarr_zip')),
          ).then((r) => r.flat()),
          Promise.all(
            sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'segmentations_ome_zarr_zip')),
          ).then((r) => r.flat()),
        ]);

        if (imageResult.status === 'fulfilled') {
          const signedUrls = imageResult.value.map(({ url }) => url);
          setOmeZarrUrls(signedUrls);
          setOmeZarrSampleIds(
            isObj2s ? imageResult.value.map(({ fileId }) => fileId) : sampleIdsForFileUrls,
          );
        } else {
          console.error('[SpatialViewer] Image URL fetch failed:', imageResult.reason);
        }

        if (segResult.status === 'fulfilled') {
          setSegmentationsOmeZarrUrls(segResult.value.map(({ url }) => url));
        } else {
          console.info('[SpatialViewer] segmentations_ome_zarr_zip unavailable — diamond fallback active.');
        }
      } catch (e) {
        console.error('[SpatialViewer] URL fetch error:', e);
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  // ── Grid shape ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!omeZarrUrls.length) return;
    const numColumns = Math.min(omeZarrUrls.length, 4);
    const numRows = Math.ceil(omeZarrUrls.length / numColumns);
    setGridShape([numRows, numColumns]);
  }, [omeZarrUrls]);

  // ── Image loader ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!omeZarrUrls.length || !gridShape) return;
    const roots = omeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));
    loadOmeZarrGrid(roots, gridShape).then(setLoader);
  }, [omeZarrUrls, gridShape]);

  // ── Segmentations bitmask loader ──────────────────────────────────────────
  useEffect(() => {
    if (!segmentationsOmeZarrUrls.length || !gridShape) return;
    const roots = segmentationsOmeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));
    loadOmeZarrGrid(roots, gridShape)
      .then(setSegmentationsLoader)
      .catch((e) => console.error('[SpatialViewer] Segmentations loader error:', e));
  }, [segmentationsOmeZarrUrls, gridShape]);

  // ── Per-image shape ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!loader) return;
    const [, w, h] = loader.shape;
    setPerImageShape([w, h]);
  }, [loader]);

  // ── Initial view state ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loader || !width || !height || viewState) return;
    setViewState(getDefaultInitialViewState(loader.data, { width, height }, 0.5));
  }, [loader, width, height]);

  // ── Loading guard ─────────────────────────────────────────────────────────
  const showLoader = useMemo(() => {
    const dataNotReady = !data || loading;
    const geneNotReady = focusData.store === 'genes' && !expressionMatrix.geneIsLoaded(focusData.key);
    return dataNotReady || geneNotReady;
  });

  // ── Embedding settings ────────────────────────────────────────────────────
  const embeddingSettings = useSelector(
    (state) => state.experimentSettings?.originalProcessing?.configureEmbedding?.embeddingSettings,
  );
  useEffect(() => {
    if (!embeddingSettings) dispatch(loadProcessingSettings(experimentId));
  }, []);
  useEffect(() => {
    if (embeddingSettings && !data) dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE));
  }, [embeddingSettings]);

  // ── Focus / colour changes ────────────────────────────────────────────────
  useEffect(() => {
    const { store, key } = focusData;
    switch (store) {
      case 'genes':
        dispatch(loadGeneExpression(experimentId, [key], 'embedding'));
        setCellInfoVisible(false);
        return;
      case 'cellSets':
        setCellColors(renderCellSetColors(key, cellSetHierarchy, cellSetProperties));
        setCellInfoVisible(false);
        return;
      default:
        setCellColors({});
        setCellInfoVisible(false);
    }
  }, [focusData, cellSetHierarchy, cellSetProperties]);

  useEffect(() => {
    if (!expressionMatrix.geneIsLoaded(focusData.key)) return;
    const truncated = expressionMatrix.getTruncatedExpression(focusData.key);
    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(focusData.key);
    setCellColors(colorByGeneExpression(truncated, colorInterpolator, truncatedMin, truncatedMax));
  }, [focusData.key, expressionLoading]);

  // ── Hidden cell IDs ───────────────────────────────────────────────────────
  const hiddenCellIds = useMemo(() => {
    if (!cellSetHidden || !cellSetProperties) return new Set();
    return union([...cellSetHidden], cellSetProperties);
  }, [cellSetHidden, cellSetProperties]);

  // ── Centroid positions ────────────────────────────────────────────────────
  // Only excludes explicitly hidden cell sets. Cells without a colour
  // assignment in the active scheme are kept (they render grey in the LUT).
  // Filtered/QC-failed cells are absent from offsetData entirely so they
  // are never added here and remain transparent in the bitmask.
  const centroidPositionData = useMemo(() => {
    if (!offsetData) return [];
    const result = [];
    offsetData.forEach(([x, y], key) => {
      if (hiddenCellIds.has(key)) return;
      result.push({ position: [x, y], cellId: key.toString() });
    });
    return result;
  }, [offsetData, hiddenCellIds]);

  // ── Colour LUT (RGBA) ─────────────────────────────────────────────────────
  // Cells absent from offsetData (filtered/QC-failed) are never iterated so
  // their LUT entries stay [0,0,0,0] → transparent.
  // Cells present in offsetData but with no colour assignment in the active
  // scheme (e.g. not in the focused custom cluster) get grey, matching the
  // embedding behaviour.
  const colorLUT = useMemo(() => {
    const lut = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);

    if (!offsetData) return lut;

    const hasCellColors = Object.keys(cellColors).length > 0;

    offsetData.forEach((_, cellIdKey) => {
      if (hiddenCellIds.has(cellIdKey)) return; // alpha stays 0 → transparent

      const pixelValue = Number(cellIdKey) + 1;
      if (pixelValue <= 0 || pixelValue >= BITMASK_LUT_SIZE * BITMASK_LUT_SIZE) return;

      let r; let g; let b;
      if (hasCellColors) {
        const colorValue = cellColors[String(cellIdKey)];
        if (colorValue) {
          [r, g, b] = parseColor(colorValue);
        } else {
          // No assignment in active scheme → grey, not hidden
          r = DEFAULT_CELL_GREY;
          g = DEFAULT_CELL_GREY;
          b = DEFAULT_CELL_GREY;
        }
      } else {
        r = DEFAULT_CELL_GREY;
        g = DEFAULT_CELL_GREY;
        b = DEFAULT_CELL_GREY;
      }

      lut[pixelValue * 4] = r;
      lut[pixelValue * 4 + 1] = g;
      lut[pixelValue * 4 + 2] = b;
      lut[pixelValue * 4 + 3] = 255;
    });

    return lut;
  }, [cellColors, offsetData, hiddenCellIds]);

  // ── Diamond fallback ──────────────────────────────────────────────────────
  const polygonShapeData = useMemo(() => {
    if (segmentationsLoader || !offsetData) return null;
    const shapes = [];
    offsetData.forEach(([x, y], key) => {
      if (hiddenCellIds.has(key)) return;
      const r = DIAMOND_RADIUS;
      shapes.push({
        polygon: new Float32Array([x, y + r, x + r, y, x, y - r, x - r, y, x, y + r]),
        cellId: key.toString(),
      });
    });
    return shapes.length > 0 ? shapes : null;
  }, [offsetData, hiddenCellIds, segmentationsLoader]);

  const polygonColorMap = useMemo(() => {
    if (!polygonShapeData) return null;
    const map = new Map();
    polygonShapeData.forEach(({ cellId }) => { map.set(cellId, parseColor(cellColors[cellId])); });
    return map;
  }, [cellColors, polygonShapeData]);

  // ── Cell-id → screen position ─────────────────────────────────────────────
  const cellIdToPositionMap = useMemo(() => {
    const map = new Map();
    centroidPositionData.forEach((d) => { map.set(String(d.cellId), d.position); });
    return map;
  }, [centroidPositionData]);

  // ── Lasso quadtree ────────────────────────────────────────────────────────
  useEffect(() => {
    if (centroidPositionData.length === 0) {
      setCellsQuadTree(null);
      return;
    }
    setCellsQuadTree(buildCellsQuadTree(centroidPositionData));
  }, [centroidPositionData]);

  // ── Selected-cell tooltip + crosshair ─────────────────────────────────────
  useEffect(() => {
    if (!selectedCell) { setCellInfoTooltip(null); return; }

    let expressionToDispatch;
    let geneName;
    if (expressionMatrix.geneIsLoaded(focusData.key)) {
      geneName = focusData.key;
      [expressionToDispatch] = expressionMatrix.getRawExpression(focusData.key, [parseInt(selectedCell, 10)]);
    }
    const cellProperties = getContainingCellSetsProperties(
      Number.parseInt(selectedCell, 10), ['sample', ...rootClusterNodes], cellSets,
    );
    const prefixedNames = [];
    Object.values(cellProperties).forEach((clusterProps) => {
      clusterProps.forEach(({ name, parentNodeKey }) => {
        prefixedNames.push(`${cellSetProperties[parentNodeKey].name}: ${name}`);
      });
    });
    setCellInfoTooltip({
      cellSets: prefixedNames,
      cellId: selectedCell,
      componentType: EMBEDDING_TYPE,
      expression: expressionToDispatch,
      geneName,
    });

    // Only project centroid → screen for EXTERNAL selections (e.g. from heatmap).
    const isExternalSelection = String(selectedCell) !== String(hoveredByPointerRef.current);
    if (isExternalSelection) {
      const position = cellIdToPositionMap.get(String(selectedCell));
      const vs = viewStateRef.current;
      if (position && vs) {
        try {
          const vp = new OrthographicViewport({ width, height, zoom: vs.zoom, target: vs.target });
          const [sx, sy] = vp.project([...position, 0]);
          cellCoordinatesRef.current = { x: sx, y: sy, width, height };
        } catch (_e) { /* off-screen */ }
      }
    }
  }, [selectedCell, cellIdToPositionMap, width, height]);

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const setCellHighlight = useCallback((cell) => {
    if (!cell) return;
    dispatch(updateCellInfo({ cellId: cell }));
  }, []);

  const clearCellHighlight = useCallback(() => {
    dispatch(updateCellInfo({ cellId: null }));
  }, []);

  // ── Hover handler ─────────────────────────────────────────────────────────
  const MAX_HOVER_RADIUS = 15;

  const handleDeckGLHover = useCallback((info) => {
    if (!info || !info.coordinate) {
      clearCellHighlight();
      return;
    }

    if (segmentationsLoader && cellsQuadTree) {
      const [worldX, worldY] = info.coordinate;
      const nearest = cellsQuadTree.find(worldX, worldY, MAX_HOVER_RADIUS);

      if (nearest) {
        const { cellId } = nearest;
        hoveredByPointerRef.current = cellId;

        const centroid = cellIdToPositionMap.get(cellId);
        const vs = viewStateRef.current;
        if (centroid && vs) {
          try {
            const vp = new OrthographicViewport({
              width, height, zoom: vs.zoom, target: vs.target,
            });
            const [sx, sy] = vp.project([...centroid, 0]);
            cellCoordinatesRef.current = { x: sx, y: sy, width, height };
          } catch (_e) {
            cellCoordinatesRef.current = { x: info.x, y: info.y, width, height };
          }
        }
        setCellHighlight(cellId);
        return;
      }

      hoveredByPointerRef.current = null;
      clearCellHighlight();
      return;
    }

    // Fallback: diamond polygon layer
    const layerId = info.layer?.id;
    if (layerId === 'segmentations-polygon' && info.object) {
      hoveredByPointerRef.current = info.object.cellId;
      cellCoordinatesRef.current = { x: info.x, y: info.y, width, height };
      setCellHighlight(info.object.cellId);
    } else {
      hoveredByPointerRef.current = null;
      clearCellHighlight();
    }
  }, [
    segmentationsLoader, cellsQuadTree, cellIdToPositionMap,
    setCellHighlight, clearCellHighlight, width, height,
  ]);

  const setCellSelection = useCallback((selection) => {
    const arr = Array.from(selection);
    if (!arr.length) return;
    setCreateClusterPopover(true);
    setSelectedIds(new Set(arr.map((id) => {
      const n = parseInt(id, 10);
      return Number.isNaN(n) ? id : n;
    })));
  }, []);

  const handleEdit = useCallback(({ updatedData, editType }) => {
    if (editType !== 'addFeature' || !updatedData.features.length) return;
    const { coordinates } = updatedData.features[0].geometry;
    const ring = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;
    if (ring.length >= 3 && cellsQuadTree && centroidPositionData) {
      const selected = selectCellsInPolygon(cellsQuadTree, centroidPositionData, ring);
      if (selected.size > 0) setCellSelection(selected);
    }
  }, [cellsQuadTree, centroidPositionData, setCellSelection]);

  const onRecenterClick = useCallback(() => {
    if (!loader || !width || !height) return;
    setViewState(getDefaultInitialViewState(loader.data, { width, height }, 0.5));
  }, [loader, width, height]);

  // ── Layer visibility ──────────────────────────────────────────────────────
  const showFilled = spatialSettings.showSegmentations !== false;
  const showOutlines = spatialSettings.showSegmentationOutlines === true;
  const cellLayerVisible = showFilled || showOutlines;
  // Hover-fill layer only needed when outlines are on but fill is off.
  // When fill is on, the fill layer already provides the hover tint itself.
  const outlineOnlyHover = showOutlines && !showFilled;

  // ── Image layer ───────────────────────────────────────────────────────────
  const imageLayer = useMemo(() => {
    if (!loader?.data) return null;
    return new MultiscaleImageLayer({
      id: 'image-layer',
      loader: loader.data,
      selections: [{ c: 0 }, { c: 1 }, { c: 2 }],
      contrastLimits: [[0, 255], [0, 255], [0, 255]],
      colors: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
      channelsVisible: [true, true, true],
      opacity: spatialSettings.showImages !== false ? 1 : 0,
      colormap: null,
      pickable: false,
    });
  }, [loader, spatialSettings.showImages]);

  // ── Bitmask fill layer ────────────────────────────────────────────────────
  const bitmaskFillLayer = useMemo(() => {
    if (!segmentationsLoader?.data || !showFilled) return null;
    return new MultiscaleImageLayer({
      id: 'segmentations-bitmask-fill',
      loader: segmentationsLoader.data,
      selections: [{ c: 0 }],
      channelsVisible: [true],
      contrastLimits: [[0, 65535]],
      colors: [[255, 255, 255]],
      opacity: 0.75,
      visible: true,
      pickable: false,
      renderSubLayers: renderSubBitmaskLayers,
      cellColorData: colorLUT,
      cellTexHeight: BITMASK_LUT_SIZE,
      cellTexWidth: BITMASK_LUT_SIZE,
      hoveredCell: selectedCell ? Number(selectedCell) + 1 : 0,
      showOutlineOnly: false,
      excludeBackground: true,
      expressionData: DUMMY_EXPRESSION_DATA,
      isExpressionMode: false,
      colorScaleLo: 0,
      colorScaleHi: 1,
      maxRequests: 15,
      maxCacheSize: 512,
    });
  }, [segmentationsLoader, colorLUT, showFilled, selectedCell]);


  // ── Bitmask outline layer ─────────────────────────────────────────────────
  // Hover tint suppressed — when fill is also on the fill layer owns the
  // highlight; when fill is off the hover-fill layer provides it instead.
  const bitmaskOutlineLayer = useMemo(() => {
    if (!segmentationsLoader?.data || !showOutlines) return null;
    return new MultiscaleImageLayer({
      id: 'segmentations-bitmask-outline',
      loader: segmentationsLoader.data,
      selections: [{ c: 0 }],
      channelsVisible: [true],
      contrastLimits: [[0, 65535]],
      colors: [[255, 255, 255]],
      opacity: 0.75,
      visible: true,
      pickable: false,
      renderSubLayers: renderSubBitmaskLayers,
      cellColorData: colorLUT,
      cellTexHeight: BITMASK_LUT_SIZE,
      cellTexWidth: BITMASK_LUT_SIZE,
      hoveredCell: 0,
      showOutlineOnly: true,
      excludeBackground: true,
      expressionData: DUMMY_EXPRESSION_DATA,
      isExpressionMode: false,
      colorScaleLo: 0,
      colorScaleHi: 1,
      maxRequests: 15,
      maxCacheSize: 512,
    });
  }, [segmentationsLoader, colorLUT, showOutlines]);

  // ── Hover-fill colour LUT (outline mode only, RGBA) ───────────────────────
  // Contains exactly one non-zero entry: the hovered cell with alpha = 255.
  // All other entries are [0,0,0,0] → shader discards them → fully transparent.
  // When nothing is hovered, returns the stable EMPTY_COLOR_LUT constant so
  // no new buffer is allocated and no GPU texture re-upload occurs.
  const hoverFillColorLUT = useMemo(() => {
    if (!outlineOnlyHover || !segmentationsLoader) return null;
    if (!selectedCell) return EMPTY_COLOR_LUT;

    const lut = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);
    const pixelValue = Number(selectedCell) + 1;
    if (pixelValue > 0 && pixelValue < BITMASK_LUT_SIZE * BITMASK_LUT_SIZE) {
      const [r, g, b] = parseColor(cellColors[String(selectedCell)]);
      lut[pixelValue * 4] = r;
      lut[pixelValue * 4 + 1] = g;
      lut[pixelValue * 4 + 2] = b;
      lut[pixelValue * 4 + 3] = 255;
    }
    return lut;
  }, [outlineOnlyHover, selectedCell, cellColors, segmentationsLoader]);

  // ── Hover-fill layer (outline mode only) ─────────────────────────────────
  // Sits above the outline layer and renders the hovered cell as a solid fill.
  // Kept alive whenever outline mode is on so its tiles stay cached — no tile
  // load delay when moving between cells.  All non-hovered pixels are
  // transparent (alpha=0 LUT entries discarded by the shader).
  const bitmaskHoverFillLayer = useMemo(() => {
    if (!segmentationsLoader?.data || !hoverFillColorLUT) return null;
    return new MultiscaleImageLayer({
      id: 'segmentations-hover-fill',
      loader: segmentationsLoader.data,
      selections: [{ c: 0 }],
      channelsVisible: [true],
      contrastLimits: [[0, 65535]],
      colors: [[255, 255, 255]],
      opacity: 0.75,
      visible: true,
      pickable: false,
      renderSubLayers: renderSubBitmaskLayers,
      cellColorData: hoverFillColorLUT,
      cellTexHeight: BITMASK_LUT_SIZE,
      cellTexWidth: BITMASK_LUT_SIZE,
      hoveredCell: 0,
      showOutlineOnly: false,
      excludeBackground: true,
      expressionData: DUMMY_EXPRESSION_DATA,
      isExpressionMode: false,
      colorScaleLo: 0,
      colorScaleHi: 1,
      maxRequests: 15,
      maxCacheSize: 512,
    });
  }, [segmentationsLoader, hoverFillColorLUT]);


  // ── Cell-visualisation + selection layers ─────────────────────────────────
  const cellAndSelectionLayers = useMemo(() => {
    const result = [];

    // Diamond fallback — only when no bitmask OME-Zarr is available
    if (!segmentationsLoader && polygonShapeData) {
      result.push(new PolygonLayer({
        id: 'segmentations-polygon',
        data: polygonShapeData,
        visible: cellLayerVisible,
        pickable: cellLayerVisible && activeTool !== 'polygon',
        autoHighlight: true,
        highlightColor: POLYGON_HIGHLIGHT_COLOR,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        filled: true,
        stroked: false,
        opacity: 0.8,
        _normalize: false,
        positionFormat: 'XY',
        getPolygon: (d) => d.polygon,
        getFillColor: (d) => polygonColorMap?.get(d.cellId) ?? DEFAULT_COLOR,
        updateTriggers: {
          getFillColor: [polygonColorMap],
          getPolygon: [polygonShapeData],
        },
      }));
    }

    if (activeTool === 'polygon' && cellsQuadTree) {
      result.push(new EditableGeoJsonLayer({
        id: 'selection-geojson',
        pickable: true,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        mode: DrawPolygonByDraggingMode,
        modeConfig: LASSO_MODE_CONFIG,
        selectedFeatureIndexes: [],
        data: EMPTY_DATA,
        onEdit: handleEdit,
        getTentativeFillColor: () => [255, 255, 255, 95],
        getTentativeLineColor: () => [143, 143, 143, 255],
        getTentativeLineDashArray: () => [7, 4],
        lineWidthMinPixels: 2,
        lineWidthMaxPixels: 2,
        getEditHandlePointColor: () => [0xff, 0xff, 0xff, 0xff],
        getEditHandlePointRadius: () => 5,
        editHandlePointRadiusScale: 1,
        editHandlePointRadiusMinPixels: 5,
        editHandlePointRadiusMaxPixels: 10,
      }));
    }

    return result;
  }, [
    segmentationsLoader, polygonShapeData, polygonColorMap,
    cellLayerVisible, activeTool, cellsQuadTree, handleEdit,
  ]);

  const layers = useMemo(
    () => [
      imageLayer,
      bitmaskFillLayer,    // solid fill (null when showFilled is off)
      bitmaskOutlineLayer, // outlines on top of fill (null when showOutlines is off)
      bitmaskHoverFillLayer, // hover fill for outlines-only mode (null otherwise)
      ...cellAndSelectionLayers,
    ].filter(Boolean),
    [imageLayer, bitmaskFillLayer, bitmaskOutlineLayer, bitmaskHoverFillLayer, cellAndSelectionLayers],
  );

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(createCellSet(experimentId, clusterName, clusterColor, selectedIds));
  };

  if (error) {
    return (
      <PlatformError
        error={error}
        onClick={() => dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE))}
      />
    );
  }

  return (
    <div
      style={{ width, height, position: 'relative', display: 'flex', flexDirection: 'column' }}
      onMouseLeave={() => { if (activeTool !== 'polygon') clearCellHighlight(); }}
      onMouseMove={() => { if (!cellInfoVisible) setCellInfoVisible(true); }}
      onClick={() => { if (activeTool !== 'polygon') clearCellHighlight(); }}
      onKeyPress={() => { if (activeTool !== 'polygon') clearCellHighlight(); }}
    >
      {loader && (
        <>
          <ToolMenu
            activeTool={activeTool}
            onToolChange={setActiveTool}
            visibleTools={{ pan: true, selectLasso: true, recenter: true }}
            recenterOnClick={onRecenterClick}
          />
          <div style={{ flex: 1, position: 'relative', opacity: showLoader ? 0 : 1 }}>
            {viewState && (
              <DeckGL
                views={deckglView}
                initialViewState={viewState}
                onViewStateChange={(e) => {
                  viewStateRef.current = e.viewState;
                  setViewState(e.viewState);
                }}
                controller={activeTool === 'polygon'
                  ? { scrollZoom: true, dragPan: false, dragRotate: false, touchZoom: true, touchRotate: false }
                  : true}
                layers={layers}
                onHover={activeTool !== 'polygon' ? handleDeckGLHover : null}
                getCursor={() => (activeTool === 'polygon' ? 'crosshair' : 'default')}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </>
      )}
      {createClusterPopover ? (
        <ClusterPopover
          visible
          popoverPosition={{ x: 0, y: 0 }}
          onCreate={onCreateCluster}
          onCancel={() => setCreateClusterPopover(false)}
        />
      ) : (
        (cellInfoVisible && cellInfoTooltip && activeTool !== 'polygon') ? (
          <div>
            <CellInfo
              containerWidth={width}
              containerHeight={height}
              componentType={EMBEDDING_TYPE}
              coordinates={cellCoordinatesRef.current}
              cellInfo={cellInfoTooltip}
            />
            <CrossHair componentType={EMBEDDING_TYPE} coordinates={cellCoordinatesRef} />
          </div>
        ) : <></>
      )}
      {showLoader && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <Loader experimentId={experimentId} size='large' />
        </div>
      )}
    </div>
  );
};

SpatialViewer.defaultProps = {};

SpatialViewer.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
};

export default SpatialViewer;

export { COMPONENT_TYPE };