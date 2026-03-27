// eslint-disable-file import/no-extraneous-dependencies
import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';

import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import * as vega from 'vega';
import { ScatterplotLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from '@nebula.gl/layers';
import { DrawPolygonByDraggingMode } from '@nebula.gl/edit-modes';

import ClusterPopover from 'components/data-exploration/embedding/ClusterPopover';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import ToolMenu from 'components/data-exploration/embedding/ToolMenu';
import { buildCellsQuadTree, selectCellsInPolygon } from 'components/data-exploration/embedding/lassoUtils';

import { loadEmbedding } from 'redux/actions/embedding';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';
import { createCellSet } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
import { updateCellInfo } from 'redux/actions/cellInfo';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';


import {
  convertCellsData,
  renderCellSetColors,
  colorByGeneExpression,
} from 'utils/plotUtils';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';

const COLOR_SCHEME = 'lightorange';
const colorInterpolator = vega.scheme(COLOR_SCHEME);

// Dynamically import DeckGL to avoid SSR issues
const DeckGL = dynamic(() => import('@deck.gl/react').then((mod) => mod.DeckGL), {
  ssr: false,
  loading: () => <div>Loading visualization...</div>,
});

const INITIAL_ZOOM = 3.5;
// TODO: make dynamic based on number of cells
// const cellRadiusFromZoom = (zoom) => zoom ** 3 / 4;

// Lasso tool constants - keep stable across renders
const EMPTY_DATA = {
  type: 'FeatureCollection',
  features: [],
};

const LASSO_MODE_CONFIG = {
  dragToDraw: true,
};

/**
 * Convert color value (hex string or array) to RGB array
 */
const parseColor = (colorValue) => {
  if (!colorValue) {
    return [128, 128, 128, 255]; // default gray
  }

  // If already an array, return as-is (ensure alpha channel)
  if (Array.isArray(colorValue)) {
    return colorValue.length === 4 ? colorValue : [...colorValue, 255];
  }

  // Parse hex string
  if (typeof colorValue === 'string') {
    const hex = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255];
    }
  }

  return [128, 128, 128, 255];
};

/**
 * Transform cell data from embedding format to deck.gl format
 * Input: { obsEmbedding: { data: [[x1, x2, ...], [y1, y2, ...]], shape }, obsEmbeddingIndex: ['cell1', 'cell2', ...] }
 * Output: [{ position: [x, y], cellId: 'cell1', color: [r, g, b, 255] }, ...]
 */
const transformCellData = (convertedCellsData, cellColors) => {
  if (!convertedCellsData || !convertedCellsData.obsEmbedding) {
    return [];
  }

  const { obsEmbedding, obsEmbeddingIndex } = convertedCellsData;
  const [xCoords, yCoords] = obsEmbedding.data;

  return xCoords.map((x, index) => {
    const y = yCoords[index];
    const cellId = obsEmbeddingIndex[index];

    // Get the color for this cell from cellColors map
    const color = parseColor(cellColors[cellId]);
    return {
      position: [x, y],
      cellId,
      color,
    };
  });
};

const Embedding = (props) => {
  const {
    experimentId, height, width,
  } = props;

  const dispatch = useDispatch();

  const [activeTool, setActiveTool] = useState(null); // null for pan, 'polygon' for lasso
  const [cellsQuadTree, setCellsQuadTree] = useState(null);

  // Ensure quadtree is built when lasso tool is activated
  useEffect(() => {
    if (activeTool === 'polygon' && !cellsQuadTree && deckglData && deckglData.length > 0) {
      const qt = buildCellsQuadTree(deckglData);
      setCellsQuadTree(qt);
    }
  }, [activeTool, cellsQuadTree, deckglData]);
  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings?.originalProcessing?.configureEmbedding?.embeddingSettings,
  );
  const embeddingType = embeddingSettings?.method;

  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};

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

  const [cellInfoTooltip, setCellInfoTooltip] = useState();
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [cellColors, setCellColors] = useState({});
  const [cellInfoVisible, setCellInfoVisible] = useState(true);
  const cellCoordinatesRef = useRef({ x: 0, y: 0, width, height });
  const initialViewState = {
    longitude: 0,
    latitude: 0,
    zoom: INITIAL_ZOOM,
    pitch: 0,
    bearing: 0,
  };
  const [viewState, setViewState] = useState(initialViewState);

  const [convertedCellsData, setConvertedCellsData] = useState();

  useEffect(() => {
    // Update ref with latest width/height
    cellCoordinatesRef.current = {
      ...cellCoordinatesRef.current,
      width,
      height,
    };
  }, [width, height]);

  const showLoader = useMemo(() => {
    const dataIsLoaded = !data || loading;
    const geneLoadedIfNecessary = focusData.store === 'genes' && !expressionMatrix.geneIsLoaded(focusData.key);

    return dataIsLoaded || geneLoadedIfNecessary;
  });

  // Load embedding settings if they aren't already.
  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, []);

  // Then, try to load the embedding with the appropriate data.
  useEffect(() => {
    if (embeddingSettings && !data) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, [embeddingSettings]);


  // Handle focus change (e.g. a cell set or gene or metadata got selected).
  // Also handle here when the cell set properties or hierarchy change.
  useEffect(() => {
    const { store, key } = focusData;

    switch (store) {
      // For genes/continous data, we cannot do this in one go,
      // we need to wait for the thing to load in first.
      case 'genes': {
        dispatch(loadGeneExpression(experimentId, [key], 'embedding'));
        setCellInfoVisible(false);
        return;
      }

      // Cell sets are easy, just return the appropriate color and set them up.
      case 'cellSets': {
        setCellColors(renderCellSetColors(key, cellSetHierarchy, cellSetProperties));
        setCellInfoVisible(false);
        return;
      }

      // If there is no focus, we can just delete all the colors.
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

  useEffect(() => {
    if (!data || !cellSetHidden || !cellSetProperties) return;

    setConvertedCellsData(convertCellsData(data, cellSetHidden, cellSetProperties));
  }, [data, cellSetHidden, cellSetProperties]);

  // Build quadtree from cell data for efficient lasso selection
  useEffect(() => {
    if (!deckglData || deckglData.length === 0) {
      setCellsQuadTree(null);
      return;
    }
    const qt = buildCellsQuadTree(deckglData);
    setCellsQuadTree(qt);
  }, [deckglData]);


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

      // getting the cluster properties for every cluster that has the cellId
      const cellProperties = getContainingCellSetsProperties(
        Number.parseInt(selectedCell, 10),
        rootClusterNodes,
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
        componentType: embeddingType,
        expression: expressionToDispatch,
        geneName,
      });
    } else {
      setCellInfoTooltip(null);
    }
  }, [selectedCell]);

  const setCellHighlight = useCallback((cell) => {
    // Keep last shown tooltip
    if (!cell) return;

    dispatch(updateCellInfo({ cellId: cell }));
  }, []);

  const clearCellHighlight = useCallback(() => {
    dispatch(updateCellInfo({ cellId: null }));
  }, []);

  const setCellsSelection = useCallback((selection) => {
    const selectionArray = selection instanceof Set ? Array.from(selection) : selection;
    if (selectionArray && selectionArray.length > 0) {
      setCreateClusterPopover(true);
      const selectedIdsToInt = new Set(selectionArray.map((id) => {
        const num = parseInt(id, 10);
        return Number.isNaN(num) ? id : num;
      }));
      setSelectedIds(selectedIdsToInt);
    }
  }, []);

  const handleDeckGLHover = useCallback((info) => {
    if (info.object) {
      setCellHighlight(info.object.cellId);

      // Use hover coordinates (cursor position on the cell)
      cellCoordinatesRef.current = {
        x: info.x,
        y: info.y,
        width,
        height
      };
    } else {
      clearCellHighlight();
    }
  }, [setCellHighlight, clearCellHighlight, width, height]);

  // Transform cell data for deck.gl
  const deckglData = useMemo(
    () => transformCellData(convertedCellsData, cellColors),
    [convertedCellsData, cellColors],
  );

  const onRecenterClick = useCallback(() => {
    setViewState(initialViewState);
  }, []);

  // Handle lasso selection
  const handleEdit = useCallback(({ updatedData, editType }) => {
    if (editType === 'addFeature' && updatedData.features.length > 0) {
      const { coordinates } = updatedData.features[0].geometry;
      const ring = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;

      if (ring.length >= 3 && cellsQuadTree && deckglData) {
        const selectedIds = selectCellsInPolygon(cellsQuadTree, deckglData, ring);
        if (selectedIds.size > 0) {
          setCellsSelection(selectedIds);
        }
      }
    }
  }, [cellsQuadTree, deckglData, setCellsSelection]);

  // Create the scatterplot layer and selection layer
  const layers = useMemo(() => {
    if (!deckglData || deckglData.length === 0) {
      return [];
    }

    const cellCount = deckglData.length;
    const isLargeDataset = cellCount > 100000;

    const baseLayers = [
      new ScatterplotLayer({
        id: 'cells-scatterplot',
        data: deckglData,
        pickable: true,
        opacity: 0.8,
        getPosition: (d) => d.position,
        getFillColor: (d) => d.color,
        stroked: false,
        getRadius: isLargeDataset ? 1 : 5,
        radiusScale: Math.pow(2, viewState.zoom - 10),
        radiusMinPixels: 0,
        radiusUnits: 'common',
        radiusMaxPixels: 6,
        updateTriggers: {
          radiusScale: [viewState.zoom],
        },
      }),
    ];

    // Add selection layer for lasso tool (only if quadtree is ready)
    if (activeTool === 'polygon' && cellsQuadTree) {
      baseLayers.push(
        new EditableGeoJsonLayer({
          id: 'selection-geojson',
          pickable: true,
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
        }),
      );
    }

    return baseLayers;
  }, [activeTool, cellsQuadTree, handleEdit, deckglData.length]);

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(
      createCellSet(
        experimentId,
        clusterName,
        clusterColor,
        selectedIds,
      ),
    );
  };

  const renderExpressionView = () => {
    if (focusData.store === 'genes') {
      const colorScale = vega.scale('sequential')()
        .interpolator(colorInterpolator);

      // Creating a sequence of colors, adjusting the range to capture various stops in the gradient.
      const colorGradient = [
        colorScale(1),
        colorScale(0.75),
        colorScale(0.5),
        colorScale(0.25),
        colorScale(0),
      ];

      return (
        <div style={{ paddingTop: 40 }}>
          <label htmlFor='continuous data name'>
            <strong>{focusData.key}</strong>
          </label>
          <div
            style={{
              position: 'absolute',
              background: `linear-gradient(${colorGradient.join(', ')})`,
              height: 200,
              width: 20,
              top: 70,
            }}
          />
        </div>
      );
    }

    if (focusData.store === 'cellSets') {
      return (
        <div style={{ paddingTop: 40 }}>
          <label htmlFor='cell set name'>
            <strong>{cellSetProperties[focusData.key] ? cellSetProperties[focusData.key].name : ''}</strong>
          </label>
        </div>
      );
    }

    return <div />;
  };

  // The embedding couldn't load. Display an error condition.
  if (error) {
    return (
      <PlatformError
        error={error}
        onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
      />
    );
  }

  return (
    <>
      {showLoader && <center><Loader experimentId={experimentId} size='large' /></center>}
      <div
        style={{
          width,
          height,
          position: 'relative',
          display: showLoader ? 'none' : 'block',
        }}
        onMouseLeave={() => {
          if (activeTool !== 'polygon') {
            clearCellHighlight();
          }
        }}
        onMouseMove={() => {
          if (!cellInfoVisible) {
            setCellInfoVisible(true);
          }
        }}
        onClick={() => {
          if (activeTool !== 'polygon') {
            clearCellHighlight();
          }
        }}
        onKeyPress={() => {
          if (activeTool !== 'polygon') {
            clearCellHighlight();
          }
        }}
      >
        {data && deckglData.length > 0 ? (
          <>
            <ToolMenu
              activeTool={activeTool}
              onToolChange={setActiveTool}
              visibleTools={{ pan: true, selectLasso: true, recenter: true }}
              recenterOnClick={onRecenterClick}
            />
            <DeckGL
              viewState={viewState}
              onViewStateChange={(e) => setViewState(e.viewState)}
              controller={activeTool === 'polygon' ? { scrollZoom: true, dragPan: false, dragRotate: false, touchZoom: true, touchRotate: false } : true}
              layers={layers}
              onHover={activeTool !== 'polygon' ? handleDeckGLHover : null}
              style={{ width: '100%', height: '100%' }}
            />
          </>
        ) : (
          <></>
        )}
        {renderExpressionView()}
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
                    componentType={embeddingType}
                    coordinates={cellCoordinatesRef.current}
                    cellInfo={cellInfoTooltip}
                  />
                  <CrossHair
                    componentType={embeddingType}
                    coordinates={cellCoordinatesRef}
                  />
                </div>
              ) : <></>
            )
        }
      </div>
    </>
  );
};

Embedding.defaultProps = {};

Embedding.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
};
export default Embedding;
