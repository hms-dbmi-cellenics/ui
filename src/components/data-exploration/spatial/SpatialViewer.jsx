import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ClusterPopover from 'components/data-exploration/embedding/ClusterPopover';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import { root as zarrRoot } from 'zarrita';
import { ZipFileStore } from '@zarrita/storage';
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

import {
  filterCentroidsData,
  offsetCentroids,
  renderCellSetColors,
  colorByGeneExpression,
} from 'utils/plotUtils';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';

import { loadOmeZarrGrid } from './loadOmeZarr';

const COMPONENT_TYPE = 'interactiveSpatial';

const RADIUS_DEFAULT = 3;

const Spatial = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Spatial),
  { ssr: false },
);

const imageLayerDefsDefault = [
  {
    channels: [
      {
        color: [
          255,
          0,
          0,
        ],
        selection: {
          c: 0,
        },
        slider: [
          0,
          255,
        ],
        visible: true,
      },
      {
        color: [
          0,
          255,
          0,
        ],
        selection: {
          c: 1,
        },
        slider: [
          0,
          255,
        ],
        visible: true,
      },
      {
        color: [
          0,
          0,
          255,
        ],
        selection: {
          c: 2,
        },
        slider: [
          0,
          255,
        ],
        visible: true,
      },
    ],
    colormap: null,
    transparentColor: null,
    index: 0,
    opacity: 1,
    domainType: 'Min/Max',
    type: 'raster',
  },
];
const EMBEDDING_TYPE = 'images';

const SpatialViewer = (props) => {
  const {
    experimentId, height, width,
  } = props;

  const dispatch = useDispatch();

  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const { data, loading, error } = useSelector((state) => state.embeddings[EMBEDDING_TYPE]) || {};

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
  const isObj2s = useSelector((state) => state.backendStatus[experimentId].status.obj2s.status !== null);

  const cellCoordinatesRef = useRef({ x: 200, y: 300 });
  const [cellInfoTooltip, setCellInfoTooltip] = useState();
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [cellColors, setCellColors] = useState({});
  const [cellInfoVisible, setCellInfoVisible] = useState(true);

  const [omeZarrSampleIds, setOmeZarrSampleIds] = useState(null);
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);
  const [loader, setLoader] = useState(null);
  const [offsetData, setOffsetData] = useState();
  const [perImageShape, setPerImageShape] = useState();
  const [gridShape, setGridShape] = useState();
  const [obsSegmentationsLayerDefs, setObsSegmentationsLayerDefs] = useState();
  const [imageLayerDefs, setImageLayerDefs] = useState(imageLayerDefsDefault);

  useEffect(() => {
    if (!_.isEmpty(spatialSettings)) {
      return;
    }
    dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  }, [spatialSettings]);

  useEffect(() => {
    setObsSegmentationsLayerDefs({
      visible: spatialSettings.showSegmentations,
      stroked: false,
      radius: RADIUS_DEFAULT,
      opacity: 1,
    });
  }, [spatialSettings.showSegmentations]);

  useEffect(() => {
    setImageLayerDefs([{
      ...imageLayerDefsDefault[0],
      opacity: spatialSettings.showImages ? 1 : 0,
    }]);
  }, [spatialSettings.showImages]);

  useEffect(() => {
    if (!data || !omeZarrSampleIds || !cellSetProperties || !perImageShape || !gridShape) return;

    setOffsetData(offsetCentroids(data, cellSetProperties, omeZarrSampleIds, perImageShape, gridShape));
  }, [data, omeZarrSampleIds, cellSetProperties, perImageShape, gridShape]);

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
      } catch (error) {
        console.error('Error fetching URLs:', error);
      }
    })(); // Immediately invoked function expression (IIFE)
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  useEffect(() => {
    if (!omeZarrUrls) return; // Exit early if there are no URLs

    // Determine grid size
    const numColumns = Math.min(omeZarrUrls.length, 4);
    const numRows = Math.ceil(omeZarrUrls.length / numColumns);

    setGridShape([numRows, numColumns]);
  }, [omeZarrUrls]);

  useEffect(() => {
    if (!omeZarrUrls || !gridShape) return;

    // Create Zarr roots for each URL
    const omeZarrRoots = omeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));

    // Load the datasets
    loadOmeZarrGrid(omeZarrRoots, gridShape).then(setLoader);
  }, [omeZarrUrls, gridShape]);

  useEffect(() => {
    if (!loader) return;

    const { shape } = loader;
    // first dim is number of color channels
    const [_, perImageWidth, perImageHeight] = shape;
    setPerImageShape([perImageWidth, perImageHeight]);
  }, [loader]);

  const originalView = {
    zoom: -2,
    target: [500, 300, null],
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    rotationOrbit: 0,
    orbitAxis: 'Y',
  };

  const [view, setView] = useState(originalView);

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

    setCellColors(colorByGeneExpression(truncatedExpression, truncatedMin, truncatedMax));
  }, [focusData.key, expressionLoading]);

  const [filteredData, setFilteredData] = useState();

  useEffect(() => {
    if (!offsetData || !cellColors || !cellSetHidden || !cellSetProperties) return;

    const hiddenCentroids = union([...cellSetHidden], cellSetProperties);
    const newFilteredData = filterCentroidsData(offsetData, cellColors, hiddenCentroids);

    setFilteredData(newFilteredData);
  }, [offsetData, cellColors, cellSetHidden, cellSetProperties]);

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

  const updateViewInfo = useCallback((viewInfo) => {
    if (selectedCell && viewInfo.projectFromId) {
      const [x, y] = viewInfo.projectFromId(selectedCell);
      cellCoordinatesRef.current = {
        x,
        y,
        width,
        height,
      };
    }
  }, [selectedCell]);

  const setCellSelection = useCallback((selection) => {
    if (Array.from(selection).length > 0) {
      setCreateClusterPopover(true);
      const selectedIdsToInt = new Set(Array.from(selection).map((id) => parseInt(id, 10)));
      setSelectedIds(selectedIdsToInt);
    }
  }, []);

  const setViewState = useCallback(({ zoom, target }) => {
    setView({ zoom, target });
  }, []);

  const getExpressionValue = useCallback(() => { }, []);
  const getCellIsSelected = useCallback(() => { }, []);

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
    <>
      {showLoader && <center><Loader experimentId={experimentId} size='large' /></center>}
      <div
        className='vitessce-container vitessce-theme-light'
        style={{
          width,
          height,
          position: 'relative',
          display: showLoader ? 'none' : 'block',
        }}
        // make sure that the crosshairs don't break zooming in and out of the embedding
        onWheel={() => { setCellInfoVisible(false); }}
        onMouseMove={() => {
          if (!cellInfoVisible) {
            setCellInfoVisible(true);
          }
        }}
        onMouseLeave={clearCellHighlight}
        onClick={clearCellHighlight}
        onKeyPress={clearCellHighlight}
      >
        {
          filteredData ? (
            <Spatial
              viewState={view}
              setViewState={setViewState}
              uuid='spatial-0'
              width={width}
              height={height}
              theme='light2'
              imageLayerLoaders={{ 0: loader }}
              imageLayerDefs={imageLayerDefs}
              obsCentroids={filteredData?.obsCentroids}
              obsCentroidsIndex={filteredData?.obsCentroidsIndex}
              cellColors={filteredData?.centroidColors}
              obsSegmentationsLayerDefs={obsSegmentationsLayerDefs}
              cellSelection={filteredData?.obsCentroidsIndex}
              cellColorEncoding='cellSetSelection'
              geneExpressionColormapRange={[0, 1]}
              geneExpressionColormap='plasma'
              getExpressionValue={getExpressionValue}
              setCellSelection={setCellSelection}
              updateViewInfo={updateViewInfo}
              setCellHighlight={setCellHighlight}
              originalViewState={originalView}
            />
          ) : ''
        }
        {
          createClusterPopover
            ? (
              <ClusterPopover
                visible
                popoverPosition={cellCoordinatesRef}
                onCreate={onCreateCluster}
                onCancel={() => setCreateClusterPopover(false)}
              />
            ) : (
              (cellInfoVisible && cellInfoTooltip) ? (
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
      </div>
    </>
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
