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
  const [isHeatmapGenesLoading, setIsHeatmapGenesLoading] = useState(false);
  const currentHeatmapSettings = useRef();

  const louvainClustersResolutionRef = useRef(null);

  const expressionData = useSelector((state) => state.genes.expression);
  const {
    loading: markerGenesLoading, error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const hoverCoordinates = useRef({});

  const cellSets = useSelector((state) => state.cellSets);
  const cellSetsHierarchy = useSelector((state) => state.cellSets.hierarchy);
  const cellSetsLoading = useSelector((state) => state.cellSets.loading);
  const cellSetsHidden = useSelector((state) => state.cellSets.hidden);

  const heatmapSettings = useSelector(
    (state) => state.componentConfig[COMPONENT_TYPE]?.config,
  ) || {};

  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  );

  const {
    legendIsVisible,
  } = heatmapSettings;

  const { error: expressionDataError } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

  const [maxCells, setMaxCells] = useState(1000);

  const setVegaDataWithDebounce = useCallback(_.debounce((data) => {
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
    const selectedGenesLoading = _.intersection(selectedGenes, loadingGenes).length > 0;

    // markerGenesLoading only happen on the first load
    // selectedGenesLoading happens every time the selected genes are changed
    if (selectedGenesLoading || markerGenesLoading) {
      setIsHeatmapGenesLoading(true);
      return;
    }

    setIsHeatmapGenesLoading(false);
  }, [selectedGenes, loadingGenes, markerGenesLoading]);

  useEffect(() => {
    if (cellSetsLoading || cellSetsHierarchy.length === 0) {
      return;
    }

    const legends = legendIsVisible ? spec.legends : [];
    setVegaSpec({ ...spec, legends });
  }, [legendIsVisible]);

  useEffect(() => {
    if (!selectedGenes?.length > 0
      || cellSetsHierarchy.length === 0
      || _.isEqual(currentHeatmapSettings, heatmapSettings)
    ) {
      return;
    }

    currentHeatmapSettings.current = heatmapSettings;

    const data = populateHeatmapData(
      cellSets, heatmapSettings, expressionData, selectedGenes, true,
    );
    setVegaDataWithDebounce(data);
  }, [
    selectedGenes,
    heatmapSettings,
    maxCells,
    markerGenesLoading,
    cellSetsLoading,
    cellSetsHidden,
  ]);

  useEffect(() => {
    if (louvainClustersResolution
      && !_.isEqual(louvainClustersResolutionRef.current, louvainClustersResolution)
    ) {
      louvainClustersResolutionRef.current = louvainClustersResolution;
      dispatch(loadMarkerGenes(experimentId, louvainClustersResolution, COMPONENT_TYPE));
    }
  }, [louvainClustersResolution]);

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

    dispatch(updateCellInfo({ cellName }));
  };

  if (markerGenesLoadingError) {
    return (
      <PlatformError
        error={expressionDataError}
        onClick={() => {
          dispatch(loadMarkerGenes(experimentId, louvainClustersResolution, COMPONENT_TYPE));
        }}
      />
    );
  }

  if (expressionDataError || viewError) {
    return (
      <PlatformError
        error={expressionDataError}
        onClick={async () => {
          dispatch(loadGeneExpression(experimentId, selectedGenes, COMPONENT_TYPE));
        }}
      />
    );
  }

  if (
    isHeatmapGenesLoading
    || cellSetsLoading
  ) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (!selectedGenes || selectedGenes.length === 0) {
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

  if (!vegaData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Skeleton.Image />
      </center>
    );
  }

  const signalListeners = {
    mouseOver: handleMouseOver,
  };

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
