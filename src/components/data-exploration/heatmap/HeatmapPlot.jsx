import React, {
  useRef, useEffect, useState,
} from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Typography, Skeleton,
} from 'antd';
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

import HeatmapCellInfo from 'components/data-exploration/heatmap/HeatmapCellInfo';
import HeatmapTracksCellInfo from 'components/data-exploration/heatmap/HeatmapTracksCellInfo';

import getCellClassProperties from 'utils/cellSets/getCellClassProperties';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';

const COMPONENT_TYPE = 'interactiveHeatmap';
const { Text } = Typography;

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

  const [vitessceData, setVitessceData] = useState(null);

  const cellCoordinatesRef = useRef({ x: 200, y: 300 });

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

  const focusedExpression = useSelector((state) => state.genes.expression.data[geneHighlight]);

  const { error: expressionDataError } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

  const updateCellCoordinates = (newView) => {
    if (cellHighlight && newView.project) {
      const [x, y] = newView.project(cellHighlight, geneHighlight);

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
    if (cellHighlight) {
      const containingClusters = getCellClassProperties(parseInt(cellHighlight, 10), ['louvain', 'scratchpad'], cellSets)
        .map(({ name, rootClusterName }) => `${rootClusterName} : ${name}`);

      dispatch(updateCellInfo({ cellName: cellHighlight, cellSets: containingClusters }));
    }
  }, [cellHighlight]);

  useEffect(() => {
    if (!heatmapData) return;

    setVitessceData(heatmapData);
  }, [heatmapData]);

  if (isHeatmapGenesLoading || cellSetsLoading) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (markerGenesLoadingError || expressionDataError || viewError) {
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

  if (selectedGenes?.length === 0) {
    return (
      <Empty
        description={(
          <Text>Add some genes to this heatmap to get started.</Text>
        )}
      />
    );
  }

  if (cellSetsHierarchy.length === 0) {
    return (
      <Empty
        description={(
          <Text>Configure your embedding in Data Processing to load this plot.</Text>
        )}
      />
    );
  }

  if (!heatmapData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Skeleton.Image />
      </center>
    );
  }
  const setTrackHighlight = (info) => {
    if (!info) {
      setHighlightedTrackData(null);
      return;
    }
    dispatch(updateCellInfo({ cellName: info[0] }));

    const [cellIndexStr, trackIndex, mouseX, mouseY] = info;

    const cellSetClassKey = heatmapSettings.selectedTracks[trackIndex];

    const cellClassProps = getCellClassProperties(
      cellIndexStr, [cellSetClassKey],
      cellSets,
    )[0];

    const obj = {
      cellId: cellIndexStr,
      trackName: cellClassProps?.name,
      coordinates: { x: mouseX, y: mouseY },
    };

    setHighlightedTrackData(obj);
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
        expressionMatrix={vitessceData?.expressionMatrix}
        cellColors={vitessceData?.metadataTracks.dataPoints}
        cellColorLabels={vitessceData?.metadataTracks.labels}
        hideTopLabels
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
              cellId={highlightedTrackData.cellId}
              trackName={highlightedTrackData.trackName}
              coordinates={highlightedTrackData.coordinates}
            />
          ) : cellHighlight && geneHighlight ? (
            <HeatmapCellInfo
              cellId={cellHighlight}
              geneName={geneHighlight}
              geneExpression={focusedExpression?.rawExpression.expression[cellHighlight]}
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
