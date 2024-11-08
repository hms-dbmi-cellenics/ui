import React, {
  useEffect, useState, useRef, useCallback, useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import * as vega from 'vega';
import ClusterPopover from 'components/data-exploration/embedding/ClusterPopover';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import { root as zarrRoot } from 'zarrita';
import { ZipFileStore } from '@zarrita/storage';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';

import { loadEmbedding } from 'redux/actions/embedding';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';
import { createCellSet } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
import { updateCellInfo } from 'redux/actions/cellInfo';

import {
  convertCentroidsData,
  getImageOffsets,
  renderCellSetColors,
  colorByGeneExpression,
  colorInterpolator,
} from 'utils/plotUtils';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';

import { loadOmeZarrGrid } from './loadOmeZarr';

// import ExampleData from './ExampleData';

const toDiamond = (x, y, r) => [[x, y + r], [x + r, y], [x, y - r], [x - r, y]];
const RADIUS_DEFAULT = 3;

const Spatial = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Spatial),
  { ssr: false },
);

const imageLayerDefs = [
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

const obsSegmentationsLayerDefs = {
  visible: true,
  stroked: false,
  radius: RADIUS_DEFAULT,
  opacity: 1,
};

const obsSegmentationsType = 'polygon';
const geneExpressionColormapRange = [0, 1];

const SpatialViewer = (props) => {
  const {
    experimentId, height, width,
  } = props;

  const dispatch = useDispatch();

  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const embeddingType = 'images';

  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};

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

  // shallowEqual prevents new object returned every time state updates
  const sampleIdsForFileUrls = useSelector((state) => Object.values(state.samples)
    .map((sample) => sample.uuid).filter(Boolean),
  shallowEqual);

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

  useEffect(() => {
    if (!data || !omeZarrSampleIds || !cellSetProperties) return;

    const numColumns = Math.min(omeZarrSampleIds.length, 4);

    setOffsetData(getImageOffsets(data, cellSetProperties, omeZarrSampleIds, 600, 600, numColumns));
  }, [data, omeZarrSampleIds, cellSetProperties, cellSetHidden]);

  // const getExpressionValue = useCallback(() => { }, []);

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

    // Create Zarr roots for each URL
    const omeZarrRoots = omeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));

    // Determine grid size
    const numColumns = Math.min(omeZarrUrls.length, 4);
    const numRows = Math.ceil(omeZarrUrls.length / numColumns);

    // Load the datasets
    loadOmeZarrGrid(omeZarrRoots, [numRows, numColumns]).then(setLoader);
  }, [omeZarrUrls]);

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

  // try to load the embedding with the appropriate data.
  useEffect(() => {
    if (!data) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, []);

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

  const [convertedCellsData, setConvertedCellsData] = useState();

  useEffect(() => {
    if (!offsetData || !cellSetHidden || !cellSetProperties || !omeZarrSampleIds) return;

    setConvertedCellsData(convertCentroidsData(offsetData, cellSetHidden, cellSetProperties));
  }, [offsetData, cellSetHidden, cellSetProperties]);

  // default segmentations are diamonds
  // TODO: get from backend
  const [obsSegmentations, setObsSegmentations] = useState();

  useEffect(() => {
    if (!offsetData) return;

    setObsSegmentations({
      data: offsetData.map((datum) => toDiamond(datum[0], datum[1], RADIUS_DEFAULT)),
      shape: [offsetData.length, 4, 2],
      stride: [8, 2, 1],
    });
  }, [offsetData]);

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
          prefixedCellSetNames.push(`${cellSetProperties[parentNodeKey].name} : ${name}`);
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

  const setCellsSelection = useCallback((selection) => {
    if (Array.from(selection).length > 0) {
      setCreateClusterPopover(true);
      const selectedIdsToInt = new Set(Array.from(selection).map((id) => parseInt(id, 10)));
      setSelectedIds(selectedIdsToInt);
    }
  }, []);

  const cellColorsForVitessce = useMemo(() => new Map(Object.entries(cellColors)), [cellColors]);

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
        onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
      />
    );
  }

  const renderExpressionView = () => {
    if (focusData.store === 'genes') {
      const colorScale = vega.scale('sequential')()
        .interpolator(colorInterpolator);

      return (
        <div>
          <label htmlFor='continuous data name'>
            <strong>{focusData.key}</strong>
          </label>
          <div
            style={{
              position: 'absolute',
              background: `linear-gradient(${colorScale(1)}, ${colorScale(0)})`,
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
        <div>
          <label htmlFor='cell set name'>
            <strong>{cellSetProperties[focusData.key] ? cellSetProperties[focusData.key].name : ''}</strong>
          </label>
        </div>
      );
    }

    return <div />;
  };

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
        {renderExpressionView()}
        {
          loader ? (
            <Spatial
              viewState={view}
              setViewState={setViewState}
              uuid='spatial-0'
              width={width}
              height={height}
              theme='light'
              imageLayerLoaders={{ 0: loader }}
              imageLayerDefs={imageLayerDefs}
              obsCentroids={convertedCellsData?.obsEmbedding}
              obsCentroidsIndex={convertedCellsData?.obsEmbeddingIndex}
              cellColors={cellColorsForVitessce}
              obsSegmentations={obsSegmentations}
              obsSegmentationsIndex={convertedCellsData?.obsEmbeddingIndex}
              obsSegmentationsLayerDefs={obsSegmentationsLayerDefs}
              obsSegmentationsType={obsSegmentationsType}
              cellSelection={convertedCellsData?.obsEmbeddingIndex}
              cellColorEncoding='cellSetSelection'
              geneExpressionColormapRange={geneExpressionColormapRange}
              geneExpressionColormap='plasma'
              getExpressionValue={getExpressionValue}
              // ======= EXAMPLE DATA =======
              // obsCentroids={ExampleData.obsCentroids}
              // obsCentroidsIndex={ExampleData.obsCentroidsIndex}
              // cellColors={ExampleData.cellColors}
              // obsSegmentations={ExampleData.obsSegmentations}
              // obsSegmentationsIndex={ExampleData.obsSegmentationsIndex}
              // obsSegmentationsLayerDefs={ExampleData.obsSegmentationsLayerDefs}
              // obsSegmentationsType={ExampleData.obsSegmentationsType}
              // cellSelection={ExampleData.cellSelection}
              // cellColorEncoding={ExampleData.cellColorEncoding}
              // geneExpressionColormapRange={ExampleData.geneExpressionColormapRange}
              // geneExpressionColormap={ExampleData.geneExpressionColormap}
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

SpatialViewer.defaultProps = {};

SpatialViewer.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
};

export default SpatialViewer;
