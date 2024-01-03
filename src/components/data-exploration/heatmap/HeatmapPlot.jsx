import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Empty } from 'antd';
import _ from 'lodash';

import {
  getCellSets, getCellSetsHierarchyByKeys, getSelectedMetadataTracks,
} from 'redux/selectors';

import { loadDownsampledGeneExpression, loadMarkerGenes } from 'redux/actions/genes';
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

const COMPONENT_TYPE = 'interactiveHeatmap';

const Heatmap = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Heatmap),
  { ssr: false },
);

// To avoid it sticking to the right too much (the left already has some margin)
const heatmapRightMargin = 30;
const heatmapBottomMargin = 40;
const nMarkerGenes = 5;

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const debouncedLoadDownsampledGeneExpression = _.debounce((...params) => {
    dispatch(loadDownsampledGeneExpression(...params));
  }, 1000);

  const dispatch = useDispatch();

  const loadingGenes = useSelector((state) => state.genes.expression.downsampled.loading);
  const downsampledCellOrder = useSelector(
    (state) => state.genes.expression.downsampled.cellOrder,
  );

  const { data: selectedGenes, fetching: fetchingGenes } = useSelector(
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
  } = useSelector((state) => state.genes.expression.downsampled);

  const {
    loading: markerGenesLoading, error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const cellSets = useSelector(getCellSets());

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

  const expressionMatrix = useSelector((state) => state.genes.expression.downsampled.matrix);

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
    const selectedGenesLoading = _.intersection(selectedGenes, loadingGenes).length > 0
      && fetchingGenes;

    // markerGenesLoading only happen on the first load
    // selectedGenesLoading happens every time the selected genes are changed
    if (selectedGenesLoading || markerGenesLoading) {
      setIsHeatmapGenesLoading(true);
      return;
    }

    setIsHeatmapGenesLoading(false);
  }, [selectedGenes, loadingGenes, markerGenesLoading]);

  useConditionalEffect(() => {
    if (
      !selectedGenes?.length > 0
      || !cellSets.hierarchy.length > 0
      || !downsampledCellOrder?.length > 0
    ) { return; }

    // Selected genes is not contained in heatmap settings for the
    // data exploration marker heatmap, so must be passed spearatedly.
    // Trying to assign it to heatmapSettings will throw an error because
    // heatmapSettings is is frozen in redux by immer.
    const data = generateVitessceData(
      downsampledCellOrder,
      selectedTracks,
      matrix,
      selectedGenes,
      cellSets,
    );

    setHeatmapData(data);
  }, [
    selectedGenes,
    downsampledCellOrder,
    selectedTracks,
    cellSets.hidden,
    // To reorder tracks when the track is reordered in hierarchy
    cellSets.hierarchy,
    // For when tracks colors change
    cellSets.properties,
  ]);

  useConditionalEffect(() => {
    if (
      !cellSets.accessible
      || !louvainClustersResolution
      || !heatmapSettings.groupedTracks
      || !heatmapSettings.selectedCellSet
      || !heatmapSettings.selectedPoints
      // If selectedGenes isn't null, then we are not at the initial load, so don't load markers
      // We are only supposed to load marker genes to fill up the heatmap at the beginning)
      || !_.isNil(selectedGenes)
    ) return;

    const { groupedTracks, selectedCellSet, selectedPoints } = heatmapSettings;

    const downsampleSettings = {
      groupedTracks,
      selectedCellSet,
      selectedPoints,
      hiddenCellSets: cellSets.hidden,
    };

    dispatch(loadMarkerGenes(
      experimentId,
      COMPONENT_TYPE,
      { numGenes: nMarkerGenes, ...downsampleSettings },
    ));
  }, [
    louvainClustersResolution,
    cellSets.accessible,
    heatmapSettings?.groupedTracks,
    heatmapSettings?.selectedCellSet,
    heatmapSettings?.selectedPoints,
    cellSets.hidden,
    groupedCellSets,
  ]);

  useConditionalEffect(() => {
    if (
      !cellSets.accessible
      || !louvainClustersResolution
      || !heatmapSettings.groupedTracks
      || !heatmapSettings.selectedCellSet
      || !heatmapSettings.selectedPoints
      || !selectedGenes?.length > 0
    ) return;

    // Load current genes
    debouncedLoadDownsampledGeneExpression(
      experimentId,
      selectedGenes,
      COMPONENT_TYPE,
      true,
    );
  }, [
    louvainClustersResolution,
    cellSets.accessible,
    heatmapSettings?.groupedTracks,
    heatmapSettings?.selectedCellSet,
    heatmapSettings?.selectedPoints,
    cellSets.hidden,
    groupedCellSets,
  ]);

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
            const { groupedTracks, selectedCellSet, selectedPoints } = heatmapSettings;

            dispatch(loadMarkerGenes(
              experimentId,
              COMPONENT_TYPE,
              {
                numGenes: nMarkerGenes,
                groupedTracks,
                selectedCellSet,
                selectedPoints,
              },
            ));
          }

          if ((expressionDataError || viewError) && !_.isNil(selectedGenes)) {
            debouncedLoadDownsampledGeneExpression(
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

  if (downsampledCellOrder.length === 0) {
    return (
      <center>
        <Empty description='Unhide some cell sets to show the heatmap' />
      </center>
    );
  }

  if (selectedGenes?.length === 0) {
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
        viewState={viewState}
        setViewState={setViewState}
        setCellHighlight={setCellHighlight}
        setGeneHighlight={setGeneHighlight}
        setTrackHighlight={setTrackHighlight}
        updateViewInfo={updateCellCoordinates}
      />
      <div>
        {
          highlightedTrackData ? (
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
