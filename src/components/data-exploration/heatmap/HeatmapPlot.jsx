import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Typography, Skeleton,
} from 'antd';
import _ from 'lodash';
import spec from '../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import PlatformError from '../../PlatformError';
import { updateCellInfo } from '../../../redux/actions/cellInfo';
import { loadGeneExpression, loadMarkerGenes } from '../../../redux/actions/genes';
import { loadCellSets } from '../../../redux/actions/cellSets';
import { loadComponentConfig } from '../../../redux/actions/componentConfig';
import populateHeatmapData from '../../plots/helpers/populateHeatmapData';
import Loader from '../../Loader';

const COMPONENT_TYPE = 'interactiveHeatmap';
const { Text } = Typography;

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const dispatch = useDispatch();

  const loadingGenes = useSelector((state) => state.genes.expression.loading);
  const selectedGenes = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.data);

  const [vegaData, setVegaData] = useState(null);
  const [vegaSpec, setVegaSpec] = useState(spec);

  const expressionData = useSelector((state) => state.genes.expression);
  const {
    loading: markerGenesLoading, error: markerGenesLoadingError, order: markerGenesOrder,
  } = useSelector((state) => state.genes.markers);

  const hoverCoordinates = useRef({});

  const cellSets = useSelector((state) => state.cellSets);
  const {
    hierarchy, properties, hidden, loading: cellSetsLoading,
  } = cellSets;

  const heatmapSettings = useSelector(
    (state) => state.componentConfig[COMPONENT_TYPE]?.config,
  ) || {};

  const loadingProcessingSettings = useSelector(
    (state) => state.experimentSettings.processing.meta.loading,
  );

  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  );

  const {
    selectedTracks, groupedTracks, expressionValue, legendIsVisible,
  } = heatmapSettings;

  const { error } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

  const [maxCells, setMaxCells] = useState(1000);

  const setDataDebounce = useCallback(_.debounce((data) => {
    setVegaData(data);
  }, 1500, { leading: true }), []);

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
    if (hierarchy.length === 0 || cellSetsLoading) {
      return;
    }

    const legends = legendIsVisible ? spec.legends : [];
    setVegaSpec({ ...spec, legends });
  }, [legendIsVisible]);

  useEffect(() => {
    if (!selectedGenes || selectedGenes.length === 0) {
      return;
    }

    if (_.intersection(selectedGenes, loadingGenes).length > 0) {
      setVegaData(null);
      return;
    }

    const data = populateHeatmapData(
      cellSets, heatmapSettings, expressionData, selectedGenes, true,
    );
    setDataDebounce(data);
  }, [loadingGenes,
    selectedGenes,
    hidden,
    selectedTracks,
    groupedTracks,
    maxCells,
    properties,
    hierarchy,
    expressionValue]);

  useEffect(() => {
    if (markerGenesLoading && !markerGenesOrder && !loadingProcessingSettings) {
      dispatch(loadMarkerGenes(experimentId, louvainClustersResolution));
    }
  }, [markerGenesOrder, markerGenesLoading, loadingProcessingSettings]);

  useEffect(() => {
    setMaxCells(Math.floor(width * 0.8));
  }, [width]);

  const handleMouseOver = (...args) => {
    if (args.length < 2) {
      return;
    }

    if ('x' in args[1] && 'y' in args[1]) {
      hoverCoordinates.current = {
        x: args[1].x,
        y: args[1].y,
      };
    }

    if (!args[1].datum) {
      return;
    }

    const { cellId: cellName } = args[1].datum;

    dispatch(
      updateCellInfo(
        {
          cellName,
        },
      ),
    );
  };

  if (error || viewError || markerGenesLoadingError) {
    return (
      <PlatformError
        error={error}
        onClick={() => {
          dispatch(loadGeneExpression(experimentId, selectedGenes, COMPONENT_TYPE));
        }}
      />
    );
  }

  if (cellSetsLoading || expressionData.loading.length || markerGenesLoading) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  const signalListeners = {
    mouseOver: handleMouseOver,
  };

  if (!selectedGenes || selectedGenes.length === 0) {
    return (
      <Empty
        description={(
          <Text>Add some genes to this heatmap to get started.</Text>
        )}
      />
    );
  }

  if (!vegaData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Skeleton.Image />
      </center>
    );
  }

  return (
    <div>
      <VegaHeatmap
        spec={vegaSpec}
        data={vegaData}
        showAxes={selectedGenes?.length <= 30}
        rowsNumber={selectedGenes.length}
        signalListeners={signalListeners}
        width={width}
        height={height}
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

export { HeatmapPlot, COMPONENT_TYPE };
