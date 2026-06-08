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
  offsetPolygons,
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
const SEGMENTATIONS_TYPE = 'polygons';

// Lasso tool constants — stable across renders
const LASSO_MODE_CONFIG = { dragToDraw: true };
const EMPTY_DATA = { type: 'FeatureCollection', features: [] };
const DIAMOND_RADIUS = 5; // coordinate-space radius for centroid diamond fallback
// Module-level constant so deck.gl's shallow prop diff doesn't see a new array every render.
const POLYGON_HIGHLIGHT_COLOR = [51, 51, 51, 150];
// Used as fallback when a cell has no entry in the color map.
const DEFAULT_COLOR = [128, 128, 128, 255];

// Dynamically import DeckGL to avoid SSR issues
const DeckGL = dynamic(() => import('@deck.gl/react').then((mod) => mod.DeckGL), { ssr: false });

/**
 * Convert a color value (hex string or RGB array) to an RGBA array [r, g, b, a].
 */
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
  const {
    experimentId, height, width,
  } = props;

  const dispatch = useDispatch();

  const [activeTool, setActiveTool] = useState(null); // null = pan, 'polygon' = lasso
  const [cellsQuadTree, setCellsQuadTree] = useState(null);

  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const { data, loading, error } = useSelector((state) => state.embeddings[EMBEDDING_TYPE]) || {};
  const { data: segmentationsData } = useSelector((state) => state.embeddings[SEGMENTATIONS_TYPE]) || {};

  const spatialSettings = useSelector((state) => state.componentConfig[COMPONENT_TYPE]?.config,
    _.isEqual) || {};

  // the store/key for the currently selected cell set (e.g. 'sample')
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
  const [loader, setLoader] = useState(null);
  const [offsetData, setOffsetData] = useState();
  const [offsetSegmentationsData, setOffsetSegmentationsData] = useState();
  const [perImageShape, setPerImageShape] = useState();
  const [gridShape, setGridShape] = useState();
  const [viewState, setViewState] = useState(null);

  // Memoize the OrthographicView to prevent recreation on each render, which would
  // cause deck.gl to reset its internal view state and break zoom/pan interactions.
  const deckglView = useMemo(() => new OrthographicView({ id: 'spatial', controller: true }), []);

  useEffect(() => {
    if (!_.isEmpty(spatialSettings)) {
      return;
    }
    dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  }, [spatialSettings]);

  useEffect(() => {
    if (!data || !omeZarrSampleIds.length || !cellSetProperties || !perImageShape || !gridShape) return;
    // Wait until cell set properties are populated for all sample IDs
    if (omeZarrSampleIds.some((id) => !cellSetProperties[id])) return;

    setOffsetData(offsetCentroids(data, cellSetProperties, omeZarrSampleIds, perImageShape, gridShape));
  }, [data, omeZarrSampleIds, cellSetProperties, perImageShape, gridShape]);

  useEffect(() => {
    if (!segmentationsData || !omeZarrSampleIds.length || !cellSetProperties || !perImageShape || !gridShape) return;
    // Wait until cell set properties are populated for all sample IDs
    if (omeZarrSampleIds.some((id) => !cellSetProperties[id])) return;

    setOffsetSegmentationsData(offsetPolygons(segmentationsData, cellSetProperties, omeZarrSampleIds, perImageShape, gridShape));
  }, [segmentationsData, omeZarrSampleIds, cellSetProperties, perImageShape, gridShape]);

  useEffect(() => {
    (async () => {
      try {
        const results = (await Promise.all(
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'ome_zarr_zip')),
        )).flat();

        const signedUrls = results.map(({ url }) => url);

        setOmeZarrUrls(signedUrls);

        if (isObj2s) {
          // For obj2s, file IDs correspond to sample IDs
          // whereas there is a single dummy sample ID in state
          const fileIds = results.map(({ fileId }) => fileId);
          setOmeZarrSampleIds(fileIds);
        } else {
          setOmeZarrSampleIds(sampleIdsForFileUrls);
        }
      } catch (e) {
        console.error('Error fetching URLs:', e);
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  useEffect(() => {
    if (!omeZarrUrls.length) return;

    const numColumns = Math.min(omeZarrUrls.length, 4);
    const numRows = Math.ceil(omeZarrUrls.length / numColumns);
    setGridShape([numRows, numColumns]);
  }, [omeZarrUrls]);

  useEffect(() => {
    if (!omeZarrUrls.length || !gridShape) return;

    const omeZarrRoots = omeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));
    loadOmeZarrGrid(omeZarrRoots, gridShape).then(setLoader);
  }, [omeZarrUrls, gridShape]);

  useEffect(() => {
    if (!loader) return;
    // loader.shape is the per-image shape; first dim is channels
    const { shape } = loader;
    const [, perImageWidth, perImageHeight] = shape;
    setPerImageShape([perImageWidth, perImageHeight]);
  }, [loader]);

  // Compute initial OrthographicView state once — guarded by !viewState so that
  // subsequent width/height changes (e.g. panel resize) don't clobber the user's zoom.
  useEffect(() => {
    if (!loader || !width || !height || viewState) return;
    const initialViewState = getDefaultInitialViewState(loader.data, { width, height }, 0.5);
    setViewState(initialViewState);
  }, [loader, width, height]);

  const showLoader = useMemo(() => {
    const dataIsLoaded = !data || loading;
    const geneLoadedIfNecessary = focusData.store === 'genes' && !expressionMatrix.geneIsLoaded(focusData.key);
    return dataIsLoaded || geneLoadedIfNecessary;
  });

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings?.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  // Load embedding settings if they aren't already.
  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, []);

  // Then, try to load the embedding with the appropriate data.
  useEffect(() => {
    if (embeddingSettings && !data) {
      dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE));
    }
  }, [embeddingSettings]);

  useEffect(() => {
    if (embeddingSettings) {
      dispatch(loadEmbedding(experimentId, SEGMENTATIONS_TYPE));
    }
  }, [embeddingSettings]);

  // Handle focus change (e.g. a cell set or gene or metadata got selected).
  useEffect(() => {
    const { store, key } = focusData;

    switch (store) {
      case 'genes': {
        dispatch(loadGeneExpression(experimentId, [key], 'embedding'));
        setCellInfoVisible(false);
        return;
      }
      case 'cellSets': {
        setCellColors(renderCellSetColors(key, cellSetHierarchy, cellSetProperties));
        setCellInfoVisible(false);
        return;
      }
      default: {
        setCellColors({});
        setCellInfoVisible(false);
        break;
      }
    }
  }, [focusData, cellSetHierarchy, cellSetProperties]);

  // Handle loading of expression for focused gene.
  useEffect(() => {
    if (!expressionMatrix.geneIsLoaded(focusData.key)) {
      return;
    }

    const truncatedExpression = expressionMatrix.getTruncatedExpression(focusData.key);
    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(focusData.key);

    setCellColors(colorByGeneExpression(truncatedExpression, colorInterpolator, truncatedMin, truncatedMax));
  }, [focusData.key, expressionLoading]);

  // Hidden cell IDs — only changes when visibility is toggled (not when colors change).
  const hiddenCellIds = useMemo(() => {
    if (!cellSetHidden || !cellSetProperties) return new Set();
    return union([...cellSetHidden], cellSetProperties);
  }, [cellSetHidden, cellSetProperties]);

  // Centroid position data for the lasso quadtree and crosshair projection.
  // Colors are intentionally excluded so this is stable across gene/cell-set color changes.
  const centroidPositionData = useMemo(() => {
    if (!offsetData) return [];
    const result = [];
    offsetData.forEach(([x, y], key) => {
      if (hiddenCellIds.has(key)) return;
      result.push({ position: [x, y], cellId: key.toString() });
    });
    return result;
  }, [offsetData, hiddenCellIds]);

  // Polygon shape data — ONLY changes when geometry or visibility changes, NOT when colors change.
  // Built directly from the offset arrays so that a color-only update (gene expression,
  // cell set selection) does not trigger Float32Array ring reconstruction.
  const polygonShapeData = useMemo(() => {
    if (!hiddenCellIds) return null;

    if (offsetSegmentationsData) {
      const shapes = [];
      offsetSegmentationsData.forEach((coords, key) => {
        if (hiddenCellIds.has(key) || !coords || coords.length < 4) return;
        // coords is a flat [x1, y1, x2, y2, ...] array; ensure ring is closed.
        const isClosed = coords[0] === coords[coords.length - 2]
          && coords[1] === coords[coords.length - 1];
        const flat = isClosed
          ? new Float32Array(coords)
          : new Float32Array([...coords, coords[0], coords[1]]);
        shapes.push({ polygon: flat, cellId: key.toString() });
      });
      return shapes.length > 0 ? shapes : null;
    }

    if (offsetData) {
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
    }

    return null;
  }, [offsetSegmentationsData, offsetData, hiddenCellIds]);

  // Color lookup map — ONLY changes when cellColors changes (gene/cell-set selection).
  // Separated from shape data so that a color change only re-uploads the color GPU buffer.
  const polygonColorMap = useMemo(() => {
    if (!polygonShapeData) return null;
    const map = new Map();
    polygonShapeData.forEach(({ cellId }) => {
      map.set(cellId, parseColor(cellColors[cellId]));
    });
    return map;
  }, [cellColors, polygonShapeData]);

  // Map cellId → position for crosshair projection on external cell selections
  const cellIdToPositionMap = useMemo(() => {
    const map = new Map();
    centroidPositionData.forEach((d) => { map.set(String(d.cellId), d.position); });
    return map;
  }, [centroidPositionData]);

  // Build quadtree from centroids for lasso selection (always use centroids regardless of active layer)
  useEffect(() => {
    if (activeTool !== 'polygon' || centroidPositionData.length === 0) {
      setCellsQuadTree(null);
      return;
    }
    setCellsQuadTree(buildCellsQuadTree(centroidPositionData));
  }, [activeTool, centroidPositionData]);

  useEffect(() => {
    if (selectedCell) {
      let expressionToDispatch;
      let geneName;

      if (expressionMatrix.geneIsLoaded(focusData.key)) {
        geneName = focusData.key;
        const [expression] = expressionMatrix.getRawExpression(
          focusData.key,
          [parseInt(selectedCell, 10)],
        );
        expressionToDispatch = expression;
      }

      const cellProperties = getContainingCellSetsProperties(
        Number.parseInt(selectedCell, 10),
        ['sample', ...rootClusterNodes],
        cellSets,
      );

      const prefixedCellSetNames = [];
      Object.values(cellProperties).forEach((clusterProperties) => {
        clusterProperties.forEach(({ name, parentNodeKey }) => {
          prefixedCellSetNames.push(`${cellSetProperties[parentNodeKey].name}: ${name}`);
        });
      });

      setCellInfoTooltip({
        cellSets: prefixedCellSetNames,
        cellId: selectedCell,
        componentType: EMBEDDING_TYPE,
        expression: expressionToDispatch,
        geneName,
      });

      // Project selected cell's position to screen for crosshair (e.g. selection from heatmap)
      const position = cellIdToPositionMap.get(String(selectedCell));
      if (position && viewState) {
        try {
          const viewport = new OrthographicViewport({
            width,
            height,
            zoom: viewState.zoom,
            target: viewState.target,
          });
          const [screenX, screenY] = viewport.project([...position, 0]);
          cellCoordinatesRef.current = { x: screenX, y: screenY, width, height };
        } catch (_e) {
          // Projection can fail for cells outside the current viewport; keep existing coords
        }
      }
    } else {
      setCellInfoTooltip(null);
    }
  }, [selectedCell, cellIdToPositionMap]);

  const setCellHighlight = useCallback((cell) => {
    if (!cell) return;
    dispatch(updateCellInfo({ cellId: cell }));
  }, []);

  const clearCellHighlight = useCallback(() => {
    dispatch(updateCellInfo({ cellId: null }));
  }, []);

  const handleDeckGLHover = useCallback((info) => {
    if (!info) return;
    if (info.layer?.id === 'segmentations-polygon' && info.object) {
      setCellHighlight(info.object.cellId);
      cellCoordinatesRef.current = { x: info.x, y: info.y, width, height };
    } else {
      clearCellHighlight();
    }
  }, [setCellHighlight, clearCellHighlight, width, height]);

  const setCellSelection = useCallback((selection) => {
    const arr = Array.from(selection);
    if (arr.length > 0) {
      setCreateClusterPopover(true);
      setSelectedIds(new Set(arr.map((id) => {
        const num = parseInt(id, 10);
        return Number.isNaN(num) ? id : num;
      })));
    }
  }, []);

  const handleEdit = useCallback(({ updatedData, editType }) => {
    if (editType === 'addFeature' && updatedData.features.length > 0) {
      const { coordinates } = updatedData.features[0].geometry;
      const ring = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;
      if (ring.length >= 3 && cellsQuadTree && centroidPositionData) {
        const selected = selectCellsInPolygon(cellsQuadTree, centroidPositionData, ring);
        if (selected.size > 0) setCellSelection(selected);
      }
    }
  }, [cellsQuadTree, centroidPositionData, setCellSelection]);

  const onRecenterClick = useCallback(() => {
    if (!loader || !width || !height) return;
    setViewState(getDefaultInitialViewState(loader.data, { width, height }, 0.5));
  }, [loader, width, height]);

  // Treat undefined showSegmentations as true (visible by default before config loads)
  const cellLayerVisible = spatialSettings.showSegmentations !== false;

  // Image layer is memoized independently so that zoom/pan (which updates viewState) does NOT
  // recreate the MultiscaleImageLayer and trigger viv tile-loading lag.
  const imageLayer = useMemo(() => {
    if (!loader?.data) return null;
    return new MultiscaleImageLayer({
      id: 'image-layer',
      loader: loader.data,
      // cyx format: one selection per channel — all 3 share the same (3,256,256) chunk
      // so ZipFileStore serves c=1 and c=2 from cache after the c=0 HTTP request.
      selections: [{ c: 0 }, { c: 1 }, { c: 2 }],
      contrastLimits: [[0, 255], [0, 255], [0, 255]],
      colors: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
      channelsVisible: [true, true, true],
      opacity: spatialSettings.showImages !== false ? 1 : 0,
      colormap: null,
      // The image never needs to be picked — disabling avoids a full offscreen
      // picking-buffer redraw of every tile on each hover/pan event.
      pickable: false,
    });
  }, [loader, spatialSettings.showImages]);

  // Cell and selection layers, separate from the image layer to avoid viv recreation on zoom/pan.
  const cellAndSelectionLayers = useMemo(() => {
    const result = [];

    // Single PolygonLayer: explicit segmentations or diamond fallback at centroids.
    // Always added when data is available; use `visible` prop to toggle rather than
    // removing from the array — removing destroys GPU buffers so re-enabling must
    // re-upload all vertex data from scratch.
    if (polygonShapeData) {
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
        // getFillColor reads from polygonColorMap which only changes when colors change.
        // polygonShapeData (positions) is unchanged, so only the color buffer is re-uploaded.
        getFillColor: (d) => polygonColorMap?.get(d.cellId) ?? DEFAULT_COLOR,
        updateTriggers: {
          getFillColor: [polygonColorMap],
          getPolygon: [polygonShapeData],
        },
      }));
    }

    // Lasso selection overlay
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
  }, [cellLayerVisible, polygonShapeData, polygonColorMap, activeTool, cellsQuadTree, handleEdit]);

  const layers = useMemo(
    () => [imageLayer, ...cellAndSelectionLayers].filter(Boolean),
    [imageLayer, cellAndSelectionLayers],
  );

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(createCellSet(experimentId, clusterName, clusterColor, selectedIds));
  };

  // The embedding couldn't load. Display an error condition.
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
      style={{
        width,
        height,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseLeave={() => {
        if (activeTool !== 'polygon') clearCellHighlight();
      }}
      onMouseMove={() => {
        if (!cellInfoVisible) setCellInfoVisible(true);
      }}
      onClick={() => {
        if (activeTool !== 'polygon') clearCellHighlight();
      }}
      onKeyPress={() => {
        if (activeTool !== 'polygon') clearCellHighlight();
      }}
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
                onViewStateChange={(e) => setViewState(e.viewState)}
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
      {
        createClusterPopover
          ? (
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
                <CrossHair
                  componentType={EMBEDDING_TYPE}
                  coordinates={cellCoordinatesRef}
                />
              </div>
            ) : <></>
          )
      }
      {showLoader && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
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
