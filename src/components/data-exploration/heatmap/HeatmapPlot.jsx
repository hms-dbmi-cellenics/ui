import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Empty } from 'antd';
import _ from 'lodash';

import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';
import calculateIdealNMarkerGenes from 'utils/calculateIdealNMarkerGenes';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadGeneExpression, loadMarkerGenes } from 'redux/actions/genes';
import { loadComponentConfig } from 'redux/actions/componentConfig';
import { updateCellInfo } from 'redux/actions/cellInfo';

import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';
import populateHeatmapData from 'components/plots/helpers/heatmap/populateHeatmapData';

import useConditionalEffect from 'utils/customHooks/useConditionalEffect';

const COMPONENT_TYPE = 'interactiveHeatmap';

const Heatmap = dynamic(
  () => import('vitessce/dist/umd/production/heatmap.min').then((mod) => mod.Heatmap),
  { ssr: false },
);

// To avoid it sticking to the right too much (the left already has some margin)
const heatmapRightMargin = 50;
const heatmapBottomMargin = 40;

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const dispatch = useDispatch();

  const loadingGenes = useSelector((state) => state.genes.expression.loading);
  const selectedGenes = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.data);

  const [viewState, setViewState] = useState({ zoom: 0, target: [0, 0] });
  const [heatmapData, setHeatmapData] = useState(null);
  const [highlightedTrackData, setHighlightedTrackData] = useState(null);

  const [isHeatmapGenesLoading, setIsHeatmapGenesLoading] = useState(false);

  const [geneHighlight, setGeneHighlight] = useState(null);
  const [cellHighlight, setCellHighlight] = useState(null);
  const expressionData = useSelector((state) => state.genes.expression);
  const {
    loading: markerGenesLoading, error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const cellSets = useSelector(getCellSets());

  const louvainClusterCount = useSelector(getCellSetsHierarchyByKeys(['louvain']), _.isEqual)[0]?.children.length ?? 0;

  const {
    properties: cellSetsProperties,
    hierarchy: cellSetsHierarchy,
    loading: cellSetsLoading,
    hidden: cellSetsHidden,
  } = cellSets;

  const heatmapSettings = useSelector((state) => state.componentConfig[COMPONENT_TYPE]?.config,
    _.isEqual) || {};

  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  );

  const { error: expressionDataError } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

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
    const selectedGenesLoading = _.intersection(selectedGenes, loadingGenes).length > 0;

    // markerGenesLoading only happen on the first load
    // selectedGenesLoading happens every time the selected genes are changed
    if (selectedGenesLoading || markerGenesLoading) {
      setIsHeatmapGenesLoading(true);
      return;
    }

    setIsHeatmapGenesLoading(false);
  }, [selectedGenes, loadingGenes, markerGenesLoading]);

  useConditionalEffect(() => {
    if (!selectedGenes?.length > 0
      || cellSetsHierarchy.length === 0
    ) {
      return;
    }

    const data = populateHeatmapData(
      cellSets, heatmapSettings, expressionData, selectedGenes, true, true,
    );

    setHeatmapData(data);
  }, [
    selectedGenes,
    heatmapSettings,
    cellSetsHidden,
    // To reorder tracks when the track is reordered in hierarchy
    cellSetsHierarchy,
    // For when tracks colors change
    cellSetsProperties,
  ]);

  useEffect(() => {
    if (louvainClusterCount > 0 && !markerGenesLoadingError && !markerGenesLoading) {
      const nMarkerGenes = calculateIdealNMarkerGenes(louvainClusterCount);

      dispatch(loadMarkerGenes(
        experimentId, louvainClustersResolution, COMPONENT_TYPE, nMarkerGenes,
      ));
    }
  }, [louvainClusterCount]);

  useEffect(() => {
    if (cellHighlight && geneHighlight) {
      dispatch(updateCellInfo({
        cellId: cellHighlight,
        geneName: geneHighlight,
      }));
    }

    if (highlightedTrackData?.cellId) {
      dispatch(updateCellInfo({
        cellId: highlightedTrackData.cellId,
        trackCluster: highlightedTrackData.trackCluster,
      }));
    }
  }, [cellHighlight, highlightedTrackData?.cellId]);

  if (isHeatmapGenesLoading || cellSetsLoading) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (markerGenesLoadingError || expressionDataError || viewError || !heatmapData) {
    return (
      <PlatformError
        error={expressionDataError}
        onClick={() => {
          if (markerGenesLoadingError) {
            const nMarkerGenes = calculateIdealNMarkerGenes(louvainClusterCount);

            dispatch(loadMarkerGenes(
              experimentId, louvainClustersResolution,
              COMPONENT_TYPE, nMarkerGenes,
            ));
          }

          if ((expressionDataError || viewError) && !_.isNil(selectedGenes)) {
            dispatch(loadGeneExpression(experimentId, selectedGenes, COMPONENT_TYPE));
          }
        }}
      />
    );
  }

  if (heatmapData.expressionMatrix.matrix.length === 0) {
    return (
      <center>
        <Empty description='Unhide some cell sets to show the heatmap' />
      </center>
    );
  }

  const setTrackHighlight = (info) => {
    if (!info) {
      setHighlightedTrackData(null);
      return;
    }

    const [cellIndexStr, trackIndex] = info;
    const cellSetClassKey = heatmapSettings.selectedTracks[trackIndex];

    setHighlightedTrackData({
      cellId: cellIndexStr,
      trackCluster: [cellSetClassKey],
    });
  };

  return (
    <div id='heatmap-container'>
      <Heatmap
        uuid='heatmap-0'
        theme='light'
        width={width - heatmapRightMargin}
        height={height - heatmapBottomMargin}
        colormap='plasma'
        colormapRange={[0.0, 1.0]}
        expressionMatrix={heatmapData.expressionMatrix}
        cellColors={heatmapData.metadataTracks.dataPoints}
        cellColorLabels={heatmapData.metadataTracks.labels}
        hideTopLabels
        transpose
        viewState={viewState}
        setViewState={setViewState}
        setCellHighlight={setCellHighlight}
        setGeneHighlight={setGeneHighlight}
        setTrackHighlight={setTrackHighlight}
      />
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
