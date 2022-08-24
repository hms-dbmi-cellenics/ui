import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';
import _ from 'lodash';

import { generateData as generateEmbeddingCategoricalData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import {
  insertTrajectorySpec,
  insertPseudotimeSpec,
  insertClusterColorsSpec,
  generateBaseSpec,
  generateStartingNodesData,
} from 'utils/plotSpecs/generateTrajectoryAnalysisSpec';
import {
  generateData as generatePseudotimeData,
} from 'utils/plotSpecs/generateEmbeddingContinuousSpec';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import { getCellSets } from 'redux/selectors';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import { Alert } from 'antd';

import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const TrajectoryAnalysisPlot = (props) => {
  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const {
    experimentId,
    config,
    plotData: startingNodesPlotData,
    plotLoading,
    plotDataError,
    onPlotDataErrorRetry,
    actions,
    onUpdate,
    onClickNode,
    onSelectNodes,
    resetPlot,
  } = props;

  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState({});
  const [plotState, setPlotState] = useState({
    xdom: [-10, 10],
    ydom: [-10, 10],
  });

  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector(
    (state) => state.embeddings[embeddingMethod],
  ) || {};

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    if (!embeddingData
      && embeddingMethod
      && embeddingSettings
    ) {
      dispatch(loadEmbedding(experimentId, embeddingMethod));
    }
  }, [experimentId, embeddingMethod, embeddingSettings]);

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingMethod, onUpdate);
  }, [config, embeddingMethod]);

  const { plotData: embeddingPlotData, cellSetLegendsData } = useMemo(() => {
    if (
      !config
      || !cellSets.accessible
      || cellSets.error
      || !embeddingData?.length
    ) return {};

    return generateEmbeddingCategoricalData(
      cellSets,
      config.selectedSample,
      config.selectedCellSet,
      embeddingData,
    );
  }, [config, cellSets, embeddingData]);

  const startingNodesData = useMemo(() => {
    if (
      !startingNodesPlotData
      || !startingNodesPlotData?.nodes
    ) return;

    return generateStartingNodesData(startingNodesPlotData.nodes);
  }, [startingNodesPlotData?.nodes]);

  const pseudotimeData = useMemo(() => {
    if (
      !startingNodesPlotData
      || !startingNodesPlotData?.pseudotime
    ) return;

    return generatePseudotimeData(
      cellSets,
      config.selectedSample,
      startingNodesPlotData.pseudotime,
      embeddingData,
    );
  }, [
    embeddingData,
    cellSets,
    startingNodesPlotData?.pseudotime,
    config.selectedSample,
  ]);

  useEffect(() => {
    if (
      !embeddingPlotData
      || !cellSetLegendsData
      || !startingNodesPlotData?.nodes
    ) return;

    const baseSpec = generateBaseSpec(config, embeddingPlotData, plotState);

    if (config.display.pseudotime) {
      insertPseudotimeSpec(baseSpec, config, pseudotimeData);
    } else {
      insertClusterColorsSpec(baseSpec, config, cellSetLegendsData);
    }

    if (config.display.trajectory) {
      const selectedNodes = config.selectedNodes.map(
        (nodeId) => startingNodesPlotData.nodes[nodeId],
      );

      insertTrajectorySpec(
        baseSpec,
        startingNodesData,
        selectedNodes,
        resetPlot,
      );
    }

    setPlotSpec(baseSpec);
  }, [config, cellSets, embeddingData, startingNodesPlotData, resetPlot]);

  const plotListeners = {
    domUpdates: (e, val) => {
      const [xdom, ydom] = val;
      setPlotState({ xdom, ydom });
      if (!config.isZoomOrPanned) _.debounce(onUpdate, 2000)({ isZoomOrPanned: true });
    },
    chooseNode: (eventName, payload) => {
      // eslint-disable-next-line camelcase
      const { node_id } = payload;
      onClickNode(node_id);
    },
    lassoSelection: (eventName, payload) => {
      const [x1, y1, x2, y2] = payload;

      const xStart = Math.min(x1, x2);
      const xEnd = Math.max(x1, x2);
      const yStart = Math.min(y1, y2);
      const yEnd = Math.max(y1, y2);

      const selectedNodes = Object.values(startingNodesPlotData.nodes).map(
        (node) => {
          const inSelection = xStart <= node.x && node.x <= xEnd
            && yStart <= node.y && node.y <= yEnd;

          if (inSelection) return node.node_id;
          return false;
        },
      ).filter((inSelection) => inSelection);

      onSelectNodes(selectedNodes);
    },
  };

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => { dispatch(loadCellSets(experimentId)); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings?.method)); }}
        />
      );
    }

    if (plotDataError) {
      return (
        <PlatformError
          error={plotDataError}
          onClick={onPlotDataErrorRetry}
        />
      );
    }

    if (!config
      || embeddingLoading
      || plotLoading
      || !cellSets.accessible
      || !embeddingData
      || !plotSpec
    ) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        {embeddingSettings?.method === 'tsne' && (
          <Alert
            type='warning'
            message={(
              <>
                Due to
                {' '}
                <a href='https://cole-trapnell-lab.github.io/monocle3/' target='_blank' rel='noreferrer'>Monocle3</a>
                {' '}
                limitations, only UMAP embeddings are supported for Trajectory Analysis.
                <br />
                The embedding and trajectory below are generated from a UMAP embedding of your data.
              </>
            )}
          />
        )}
        <Vega spec={plotSpec} renderer='webgl' actions={actions} signalListeners={plotListeners} />
      </center>
    );
  };

  return render();
};

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.object.isRequired,
  plotDataError: PropTypes.bool || PropTypes.string,
  onPlotDataErrorRetry: PropTypes.func,
  plotLoading: PropTypes.bool,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
  onClickNode: PropTypes.func,
  onSelectNodes: PropTypes.func,
  resetPlot: PropTypes.bool,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  plotLoading: false,
  plotDataError: false,
  onPlotDataErrorRetry: () => {},
  onClickNode: () => { },
  onSelectNodes: () => { },
  resetPlot: false,
};

export default TrajectoryAnalysisPlot;
