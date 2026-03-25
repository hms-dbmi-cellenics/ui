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
  loadGeneExpression, loadMarkerGenes,
} from 'redux/actions/genes';
import { loadComponentConfig } from 'redux/actions/componentConfig';
import { updateCellInfo } from 'redux/actions/cellInfo';

import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';

import HeatmapCellInfo from 'components/data-exploration/heatmap/HeatmapCellInfo';
import HeatmapTracksCellInfo from 'components/data-exploration/heatmap/HeatmapTracksCellInfo';

import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import generateVitessceData from 'components/plots/helpers/heatmap/vitessce/generateVitessceData';
import { loadCellSets } from 'redux/actions/cellSets';
import calculateNMarkerGenes from './calculateNMarkerGenes';

const COMPONENT_TYPE = 'interactiveHeatmap';

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

  const debouncedLoadGeneExpression = useMemo(() => {
    const debounced = _.debounce((...params) => {
      dispatch(loadGeneExpression(...params));
    }, 1000);
    return debounced;
  }, [dispatch]);

  // Cancel pending debounced calls on unmount to prevent unexpected dispatches
  useEffect(() => {
    return () => {
      debouncedLoadGeneExpression.cancel();
    };
  }, [debouncedLoadGeneExpression]);

  const loadingGenes = useSelector((state) => state.genes.expression.full.loading);

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
  // are loaded in the matrix (ignoring other genes added by other components)
  const heatmapGenesLoadedKey = useSelector((state) => {
    if (!selectedGenes?.length) return null;
    const matrix = state.genes.expression.full.matrix;
    // Check which of the heatmap's genes are currently loaded
    const loadedCount = selectedGenes.filter((gene) => matrix.geneIsLoaded(gene)).length;
    // Return a key that only changes when the loaded genes for heatmap actually change
    const key = `${selectedGenes.length}_${loadedCount}`;
    return key;
  });

  const {
    loading: markerGenesLoading, error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const cellSets = useSelector(getCellSets());

  // Calculate nMarkerGenes based on dataset size and cluster count
  const nMarkerGenes = useMemo(() => {
    if (!cellSets?.properties || !cellSets?.hierarchy) {
      console.log('[nMarkerGenes] No cellSets data available');
      return 5; // Default
    }

    // Get total cell count from 'sample' hierarchy
    const sampleNode = cellSets.hierarchy.find((node) => node.key === 'sample');
    const totalCells = sampleNode?.children?.reduce((sum, child) => {
      const cellIds = cellSets.properties[child.key]?.cellIds;
      return sum + (cellIds?.size || 0);
    }, 0) || 0;

    // Get cluster count from 'louvain' hierarchy
    const louvainNode = cellSets.hierarchy.find((node) => node.key === 'louvain');
    const clusterCount = louvainNode?.children?.length || 0;

    const result = calculateNMarkerGenes(totalCells, clusterCount);
    console.log('[nMarkerGenes] Calculated final result:', result);
    return result;
  }, [cellSets]);

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
    // Check if genes are currently being loaded
    // For downsampled expressions, we just need to check fetchingGenes
    const selectedGenesLoading = fetchingGenes
      || (_.intersection(selectedGenes, loadingGenes).length > 0);

    // markerGenesLoading only happen on the first load
    // selectedGenesLoading happens every time the selected genes are changed
    if (selectedGenesLoading || markerGenesLoading) {
      setIsHeatmapGenesLoading(true);
      return;
    }

    setIsHeatmapGenesLoading(false);
  }, [selectedGenes, loadingGenes, markerGenesLoading, fetchingGenes]);

  useEffect(() => {
    if (
      !selectedGenes?.length
      || !cellSets.hierarchy?.length
    ) { return; }
    // Check that the expression data has actually been loaded into the matrix
    // Just having geneIndexes isn't enough - we need the rawGeneExpressions data
    const [cellCount, geneCount] = matrix?.rawGeneExpressions?.size?.() || [0, 0];
    if (!geneCount || geneCount === 0) {
      // Data not ready yet, wait for the expression values to be populated
      return;
    }

    // Selected genes is not contained in heatmap settings for the
    // data exploration marker heatmap, so must be passed spearatedly.
    // Trying to assign it to heatmapSettings will throw an error because
    // heatmapSettings is is frozen in redux by immer.

    const data = generateVitessceData(
      selectedTracks,
      matrix,
      selectedGenes,
      cellSets,
      heatmapSettings,
    );
    setHeatmapData(data);
  }, [
    selectedGenes,
    selectedTracks,
    heatmapGenesLoadedKey,
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
      { numGenes: nMarkerGenes, selectedCellSet },
    ));
  }, [
    louvainClustersResolution,
    cellSets.accessible,
    heatmapSettings?.selectedCellSet,
    groupedCellSets,
  ]);

  // Only fetch gene expression if selectedGenes or selectedCellSet change
  useConditionalEffect(
    () => {
      if (
        !cellSets.accessible
        || !louvainClustersResolution
        || !heatmapSettings.groupedTracks
        || !heatmapSettings.selectedCellSet
        || selectedGenes.length === 0
        || fetchingGenes
      ) { return; }

      // Only fetch if selectedGenes or selectedCellSet changed
      debouncedLoadGeneExpression(
        experimentId,
        selectedGenes,
        COMPONENT_TYPE,
      );
    },
    [
      louvainClustersResolution,
      cellSets.accessible,
      heatmapSettings?.selectedCellSet,
      selectedGenes,
    ],
  );

  useEffect(() => {
    if (cellHighlight) {
      dispatch(updateCellInfo({ cellId: cellHighlight }));
    }
  }, [cellHighlight]);

  const clearCellInfo = useCallback(
    () => { dispatch(updateCellInfo({ cellId: null })); },
    [],
  );

  if (markerGenesLoadingError || expressionDataError || viewError) {
    return (
      <PlatformError
        error={expressionDataError}
        onClick={() => {
          if (markerGenesLoadingError) {
            const { selectedCellSet } = heatmapSettings;

            dispatch(loadMarkerGenes(
              experimentId,
              COMPONENT_TYPE,
              {
                numGenes: nMarkerGenes,
                selectedCellSet,
              },
            ));
          }

          if ((expressionDataError || viewError) && selectedGenes.length > 0) {
            debouncedLoadGeneExpression(
              experimentId, selectedGenes, COMPONENT_TYPE, true,
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
  if (!matrix?.geneIndexes || Object.keys(matrix.geneIndexes).length === 0) {
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
    dispatch(updateCellInfo({ cellId: info[0] }));

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
                expressionMatrix.getRawExpression(geneHighlight, [parseInt(cellHighlight, 10)])
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
