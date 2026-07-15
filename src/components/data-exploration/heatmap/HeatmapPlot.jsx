import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Empty } from 'antd';
import _ from 'lodash';

import {
  getCellSets, getCellSetsHierarchyByKeys, getSelectedMetadataTracks,
} from 'redux/selectors';

import {
  loadHeatmapExpression, loadMarkerGenes,
} from 'redux/actions/genes';
import { LARGE_DATASET_THRESHOLD } from 'redux/actions/genes/loadHeatmapExpression';
import { computeBucketedDisplayCellIds } from 'utils/work/getHeatmapCellOrder';
import { loadComponentConfig } from 'redux/actions/componentConfig';
import { updateCellInfo } from 'redux/actions/cellInfo';

import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';

import HeatmapCellInfo from 'components/data-exploration/heatmap/HeatmapCellInfo';
import HeatmapTracksCellInfo from 'components/data-exploration/heatmap/HeatmapTracksCellInfo';
import HOVER_SOURCE from 'utils/data-exploration/cellInfoHoverSource';

import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import generateVitessceData from 'components/plots/helpers/heatmap/vitessce/generateVitessceData';
import { loadCellSets } from 'redux/actions/cellSets';

const COMPONENT_TYPE = 'interactiveHeatmap';
const NUM_MARKER_GENES = 5;

const Heatmap = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Heatmap),
  { ssr: false },
);

// To avoid it sticking to the right too much (the left already has some margin)
const heatmapRightMargin = 30;
const heatmapBottomMargin = 40;

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const dispatch = useDispatch();

  const debouncedLoadHeatmapExpression = useMemo(() => {
    const debounced = _.debounce((...params) => {
      dispatch(loadHeatmapExpression(...params));
    }, 1000);
    return debounced;
  }, [dispatch]);

  // Cancel pending debounced calls on unmount to prevent unexpected dispatches
  useEffect(() => {
    return () => {
      debouncedLoadHeatmapExpression.cancel();
    };
  }, [debouncedLoadHeatmapExpression]);

  const {
    loading: downsampledLoading,
    error: downsampledError,
    cellIds: workerCellIds,
    downsampleType,
    lastFetchSettings,
  } = useSelector((state) => state.genes.expression.downsampled);

  const downsampledMatrix = useSelector((state) => state.genes.expression.downsampled.matrix);

  const config = useSelector((state) => state.componentConfig[COMPONENT_TYPE]?.config) || {};

  const selectedGenes = useSelector((state) => {
    const config = state.componentConfig[COMPONENT_TYPE]?.config || {};
    return config.selectedGenes || [];
  });

  const { fetching: fetchingGenes } = useSelector(
    (state) => state.genes.expression.views[COMPONENT_TYPE],
  ) ?? {};

  const [viewState, setViewState] = useState({ zoom: 0, target: [0, 0] });
  const [heatmapData, setHeatmapData] = useState(null);
  const [highlightedTrackData, setHighlightedTrackData] = useState(null);

  const [isHeatmapGenesLoading, setIsHeatmapGenesLoading] = useState(false);

  const [geneHighlight, setGeneHighlight] = useState(null);
  const [cellHighlight, setCellHighlight] = useState(null);

  const cellCoordinatesRef = useRef({ x: 200, y: 300 });

  const {
    error: expressionDataError, matrix,
  } = useSelector((state) => state.genes.expression.full);

  // Create a stable reference that only changes when the heatmap's selected genes
  // are loaded in the relevant matrix (full for small datasets, downsampled for large datasets)
  const heatmapGenesLoadedKey = useSelector((state) => {
    if (!selectedGenes?.length) return null;
    const sampleNode = state.cellSets.hierarchy?.find((node) => node.key === 'sample');
    const cells = sampleNode?.children?.reduce((sum, child) => {
      const cellIds = state.cellSets.properties[child.key]?.cellIds;
      return sum + (cellIds?.size || 0);
    }, 0) || 0;
    const mat = cells >= LARGE_DATASET_THRESHOLD
      ? state.genes.expression.downsampled.matrix
      : state.genes.expression.full.matrix;
    const loadedCount = selectedGenes.filter((gene) => mat.geneIsLoaded(gene)).length;
    return `${cells >= LARGE_DATASET_THRESHOLD ? 'd' : 'f'}_${selectedGenes.length}_${loadedCount}`;
  });

  const {
    loading: markerGenesLoading, error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const cellSets = useSelector(getCellSets());

  const totalCells = useMemo(() => {
    const sampleNode = cellSets.hierarchy?.find((node) => node.key === 'sample');
    return sampleNode?.children?.reduce((sum, child) => {
      const cellIds = cellSets.properties[child.key]?.cellIds;
      return sum + (cellIds?.size || 0);
    }, 0) || 0;
  }, [cellSets.hierarchy, cellSets.properties]);

  const isLargeDataset = totalCells >= LARGE_DATASET_THRESHOLD;

  // Note: selectedPoints is not needed for vitessce heatmap as it's always 'All'
  const heatmapSettings = useSelector((state) => state.componentConfig[COMPONENT_TYPE]?.config,
    _.isEqual) || {};
  const selectedTracks = useSelector(getSelectedMetadataTracks(COMPONENT_TYPE));
  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  );

  const groupedCellSets = useSelector((state) => {
    if (!heatmapSettings.groupedTracks) return undefined;

    const groupedCellClasses = getCellSetsHierarchyByKeys(heatmapSettings.groupedTracks)(state);

    return groupedCellClasses.map((cellClass) => cellClass.children).flat();
  }, _.isEqual);

  const expressionMatrix = useSelector((state) => state.genes.expression.full.matrix);

  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

  // Map from cell ID → matrix column index for downsampled expression data
  const cellIdToMatrixIndex = useMemo(() => {
    if (!isLargeDataset || !workerCellIds?.length) return null;
    return new Map(workerCellIds.map((id, i) => [id, i]));
  }, [isLargeDataset, workerCellIds]);

  // Bucketed downsampling: re-sample display cells from worker-returned cells applying hidden sets.
  // Deps intentionally exclude cellSets.properties / cellSets.hierarchy so that adding a custom
  // cell set to the scratchpad does not trigger a re-run.
  const bucketedDisplayCellIds = useMemo(() => {
    if (!isLargeDataset || downsampleType !== 'bucketed' || !workerCellIds?.length) return null;
    return computeBucketedDisplayCellIds(
      heatmapSettings.selectedCellSet,
      heatmapSettings.groupedTracks,
      Array.from(cellSets.hidden || []),
      cellSets,
      workerCellIds,
    );
  }, [
    isLargeDataset,
    downsampleType,
    workerCellIds,
    cellSets.hidden,
    heatmapSettings.selectedCellSet,
    heatmapSettings.groupedTracks,
  ]);

  const finalDisplayCellIds = useMemo(() => {
    if (!isLargeDataset) return null;
    if (downsampleType === 'bucketed') return bucketedDisplayCellIds;
    if (downsampleType === 'precomputed') return workerCellIds;
    return null;
  }, [isLargeDataset, downsampleType, bucketedDisplayCellIds, workerCellIds]);

  const updateCellCoordinates = (newView) => {
    if (cellHighlight && newView.projectFromId) {
      const [x, y] = newView.projectFromId(cellHighlight, geneHighlight);

      cellCoordinatesRef.current = {
        x,
        y,
        width,
        height,
      };
    }
  };

  /**
     * Loads cell set on initial render if it does not already exist in the store.
     */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!_.isEmpty(heatmapSettings)) {
      return;
    }

    dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  }, [heatmapSettings]);

  useEffect(() => {
    const selectedGenesLoading = isLargeDataset
      ? downsampledLoading
      : fetchingGenes || false;

    if (selectedGenesLoading || markerGenesLoading) {
      setIsHeatmapGenesLoading(true);
      return;
    }

    setIsHeatmapGenesLoading(false);
  }, [markerGenesLoading, fetchingGenes, isLargeDataset, downsampledLoading]);

  // Small dataset: generate heatmap from full expression matrix
  useEffect(() => {
    if (isLargeDataset) return;
    if (!selectedGenes?.length || !cellSets.hierarchy?.length) return;

    const [, geneCount] = matrix?.rawGeneExpressions?.size?.() || [0, 0];
    if (!geneCount) return;

    const data = generateVitessceData(
      selectedTracks,
      matrix,
      selectedGenes,
      cellSets,
      heatmapSettings,
    );
    setHeatmapData(data);
  }, [
    isLargeDataset,
    selectedGenes,
    selectedTracks,
    heatmapGenesLoadedKey,
    cellSets.properties,
    cellSets.hierarchy,
    cellSets.hidden,
    heatmapSettings?.selectedCellSet,
    heatmapSettings?.groupedTracks,
  ]);

  // Large dataset: generate heatmap from downsampled expression matrix.
  // cellSets.properties and cellSets.hierarchy are included so that track labels/colours
  // stay correct; the expensive getBuckets computation is avoided because finalDisplayCellIds
  // is pre-computed and passed in directly.
  useEffect(() => {
    if (!isLargeDataset) return;
    if (!selectedGenes?.length || !cellSets.hierarchy?.length) return;
    if (downsampledLoading || finalDisplayCellIds === null) return;

    // Don't render until all selected genes are present in the downsampled matrix.
    // This prevents a flash of wrong data when genes are added but haven't been fetched yet.
    const allGenesLoaded = selectedGenes.every((gene) => downsampledMatrix?.geneIsLoaded(gene));
    if (!allGenesLoaded) return;

    // Prevent rendering stale data while a new work request is in-flight.
    // The matrix was built with the settings in lastFetchSettings; if those differ from
    // the current heatmap settings, the new request hasn't completed yet.
    if (lastFetchSettings) {
      const matrixMatchesSettings = (
        lastFetchSettings.selectedCellSet === heatmapSettings.selectedCellSet
        && _.isEqual(lastFetchSettings.groupedTracks, heatmapSettings.groupedTracks)
      );
      if (!matrixMatchesSettings) return;
    }

    // All cells hidden — generate empty data to show the "unhide" message
    if (finalDisplayCellIds.length === 0) {
      setHeatmapData(generateVitessceData(
        selectedTracks, downsampledMatrix, selectedGenes, cellSets, heatmapSettings,
        [], cellIdToMatrixIndex,
      ));
      return;
    }

    const [, geneCount] = downsampledMatrix?.rawGeneExpressions?.size?.() || [0, 0];
    if (!geneCount) return;

    const data = generateVitessceData(
      selectedTracks,
      downsampledMatrix,
      selectedGenes,
      cellSets,
      heatmapSettings,
      finalDisplayCellIds,
      cellIdToMatrixIndex,
    );
    setHeatmapData(data);
  }, [
    isLargeDataset,
    downsampledLoading,
    finalDisplayCellIds,
    selectedGenes,
    selectedTracks,
    cellIdToMatrixIndex,
    lastFetchSettings,
    cellSets.properties,
    cellSets.hierarchy,
    cellSets.hidden,
    heatmapSettings?.selectedCellSet,
    heatmapSettings?.groupedTracks,
  ]);

  useConditionalEffect(() => {
    if (
      !cellSets.accessible
      || !louvainClustersResolution
      || !heatmapSettings.selectedCellSet
      // If selectedGenes isn't empty, then we are not at the initial load, so don't load markers
      // If selectedGenes is empty, load marker genes to fill up the heatmap at the beginning
      || selectedGenes.length > 0
    ) return;

    const { selectedCellSet } = heatmapSettings;

    dispatch(loadMarkerGenes(
      experimentId,
      COMPONENT_TYPE,
      { numGenes: NUM_MARKER_GENES, selectedCellSet },
    ));
  }, [
    louvainClustersResolution,
    cellSets.accessible,
    heatmapSettings?.selectedCellSet,
    groupedCellSets,
  ]);

  useConditionalEffect(
    () => {
      if (
        !cellSets.accessible
        || !louvainClustersResolution
        || !heatmapSettings.groupedTracks
        || !heatmapSettings.selectedCellSet
        || selectedGenes.length === 0
      ) { return; }

      debouncedLoadHeatmapExpression(
        experimentId,
        selectedGenes,
        {
          selectedCellSet: heatmapSettings.selectedCellSet,
          groupedTracks: heatmapSettings.groupedTracks,
          hiddenCellSets: Array.from(cellSets.hidden || []),
          plotUuid: COMPONENT_TYPE,
        },
      );
    },
    [
      louvainClustersResolution,
      cellSets.accessible,
      heatmapSettings?.selectedCellSet,
      heatmapSettings?.groupedTracks,
      selectedGenes,
      cellSets.hidden,
    ],
  );

  useEffect(() => {
    if (cellHighlight) {
      dispatch(updateCellInfo({ cellId: cellHighlight, hoverSource: HOVER_SOURCE.heatmap }));
    }
  }, [cellHighlight]);

  const clearCellInfo = useCallback(
    () => { dispatch(updateCellInfo({ cellId: null })); },
    [],
  );

  const expressionError = isLargeDataset ? downsampledError : expressionDataError;
  if (markerGenesLoadingError || expressionError || viewError) {
    return (
      <PlatformError
        error={expressionError}
        onClick={() => {
          if (markerGenesLoadingError) {
            const { selectedCellSet } = heatmapSettings;

            dispatch(loadMarkerGenes(
              experimentId,
              COMPONENT_TYPE,
              {
                numGenes: NUM_MARKER_GENES,
                selectedCellSet,
              },
            ));
          }

          if ((expressionError || viewError) && selectedGenes.length > 0) {
            debouncedLoadHeatmapExpression(
              experimentId,
              selectedGenes,
              {
                selectedCellSet: heatmapSettings.selectedCellSet,
                groupedTracks: heatmapSettings.groupedTracks,
                hiddenCellSets: Array.from(cellSets.hidden || []),
                plotUuid: COMPONENT_TYPE,
              },
            );
          }
        }}
      />
    );
  }



  if (isHeatmapGenesLoading || !cellSets.accessible || !heatmapData) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  // Also check if the expression matrix has actual gene data loaded
  const activeMatrix = isLargeDataset ? downsampledMatrix : matrix;
  if (!activeMatrix?.geneIndexes || Object.keys(activeMatrix.geneIndexes).length === 0) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }



  if (heatmapData.expressionMatrix.rows.length === 0) {
    return (
      <center>
        <Empty description='Unhide some cell sets to show the heatmap' />
      </center>
    );
  }

  if (selectedGenes.length === 0) {
    return (
      <center>
        <Empty description='No genes selected, add some to show the heatmap' />
      </center>
    );
  }

  const setTrackHighlight = (info) => {
    if (!info) {
      setHighlightedTrackData(null);
      return;
    }
    dispatch(updateCellInfo({ cellId: info[0], hoverSource: HOVER_SOURCE.heatmap }));

    const [cellIndexStr, trackIndex, mouseX, mouseY] = info;

    const cellSetClassKey = selectedTracks[trackIndex];

    const cellClassProps = getContainingCellSetsProperties(
      parseInt(cellIndexStr, 10), [cellSetClassKey],
      cellSets,
    )[cellSetClassKey][0];

    const obj = {
      cellId: cellIndexStr,
      trackName: cellClassProps?.name,
      coordinates: { x: mouseX, y: mouseY },
    };

    setHighlightedTrackData(obj);
  };

  return (
    <div id='heatmap-container' onMouseLeave={clearCellInfo}>
      <Heatmap
        uuid='heatmap-0'
        theme='light'
        width={width - heatmapRightMargin}
        height={height - heatmapBottomMargin}
        colormap='plasma'
        colormapRange={[0.0, 1.0]}
        setColorEncoding={() => { }}
        uint8ObsFeatureMatrix={heatmapData.expressionMatrix.matrix}
        featureIndex={heatmapData.expressionMatrix.cols}
        obsIndex={heatmapData.expressionMatrix.rows}
        cellColors={heatmapData.metadataTracks.dataPoints}
        cellColorLabels={heatmapData.metadataTracks.labels}
        hideObservationLabels
        transpose
        useDevicePixels={2}
        viewState={viewState}
        setViewState={setViewState}
        setCellHighlight={setCellHighlight}
        setGeneHighlight={setGeneHighlight}
        setTrackHighlight={setTrackHighlight}
        updateViewInfo={updateCellCoordinates}
      />
      <div>
        {
          highlightedTrackData?.cellId ? (
            <HeatmapTracksCellInfo
              containerWidth={width}
              containerHeight={height}
              cellId={highlightedTrackData.cellId}
              trackName={highlightedTrackData.trackName}
              coordinates={highlightedTrackData.coordinates}
            />
          ) : cellHighlight && geneHighlight ? (
            <HeatmapCellInfo
              containerWidth={width}
              containerHeight={height}
              cellId={cellHighlight}
              geneName={geneHighlight}
              geneExpression={
                isLargeDataset
                  ? cellIdToMatrixIndex?.has(parseInt(cellHighlight, 10))
                    ? downsampledMatrix.getRawExpression?.(
                      geneHighlight,
                      [cellIdToMatrixIndex.get(parseInt(cellHighlight, 10))],
                    )
                    : undefined
                  : expressionMatrix.getRawExpression(geneHighlight, [parseInt(cellHighlight, 10)])
              }
              coordinates={cellCoordinatesRef.current}
            />
          ) : <></>
        }
      </div>
    </div>
  );
};

HeatmapPlot.defaultProps = {
};

HeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default HeatmapPlot;

export { COMPONENT_TYPE };
