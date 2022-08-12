/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { generateData as generateCategoricalEmbeddingData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import {
  insertTrajectorySpec,
  insertPseudotimeSpec,
  insertClusterColorsSpec,
  generateBaseSpec,
  generateTrajectoryData,
} from 'utils/plotSpecs/generateTrajectoryAnalysisSpec';
import {
  generateData as generatePseudotimeData,
} from 'utils/plotSpecs/generateEmbeddingContinuousSpec';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import 'vega-webgl-renderer';

import { getCellSets } from 'redux/selectors';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const TrajectoryAnalysisPlot = (props) => {
  const {
    experimentId,
    plotUuid,
    actions,
    onUpdate,
    onSelectNode,
    resetPlot,
  } = props;
  const dispatch = useDispatch();

  const [plotSpec, setPlotSpec] = useState({});

  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    config,
    plotData,
  } = useSelector((state) => state.componentConfig[plotUuid]);

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector(
    (state) => state.embeddings[embeddingSettings?.method],
  ) || {};

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);
  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [experimentId, embeddingSettings?.method]);

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingSettings?.method, onUpdate);
  }, [config, embeddingSettings?.method]);

  useEffect(() => {
    if (
      !config
      || !cellSets.accessible
      || cellSets.error
      || !embeddingData?.length
      || !plotData
      || !plotData?.nodes
    ) {
      return;
    }

    const {
      selectedSample,
      selectedCellSet,
      display,
    } = config;

    const {
      plotData: plotEmbedding,
      cellSetLegendsData,
    } = generateCategoricalEmbeddingData(
      cellSets,
      selectedSample,
      selectedCellSet,
      embeddingData,
    );

    const baseSpec = generateBaseSpec(config, plotEmbedding);

    if (display.pseudotime) {
      const pseudotimeData = generatePseudotimeData(
        cellSets,
        selectedSample,
        plotData.pseudotime,
        embeddingData,
      );
      insertPseudotimeSpec(baseSpec, config, pseudotimeData);
    } else {
      insertClusterColorsSpec(baseSpec, config, cellSetLegendsData);
    }

    if (display.trajectory) {
      const trajectoryData = generateTrajectoryData(plotData.nodes);
      insertTrajectorySpec(baseSpec, trajectoryData, resetPlot);
    }

    setPlotSpec(baseSpec);
  }, [config, cellSets, embeddingData, plotData, resetPlot]);

  const plotListener = {
    chooseNode: (eventName, payload) => {
      const { node_id } = payload;
      onSelectNode(node_id);
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

    if (!config
      || !cellSets.accessible
      || !embeddingData
      || embeddingLoading
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
        <Vega
          spec={plotSpec}
          renderer='webgl'
          actions={actions}
          signalListeners={plotListener}
        />
      </center>
    );
  };

  return render();
};

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
  onSelectNode: PropTypes.func,
  resetPlot: PropTypes.bool,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  onSelectNode: () => {},
  resetPlot: false,
};

export default TrajectoryAnalysisPlot;
