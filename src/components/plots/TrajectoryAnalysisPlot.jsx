import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { generateData as generateCategoricalEmbeddingData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import {
  generateSpec,
  generateData as generateTrajectoryPathData,
} from 'utils/plotSpecs/generateTrajectoryAnalysisGraph';
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
    config,
    plotData,
    actions,
    onUpdate,
  } = props;
  const dispatch = useDispatch();

  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector(
    (state) => state.embeddings[embeddingSettings?.method],
  ) || {};

  const [plotSpec, setPlotSpec] = useState(null);

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
      plotData: plotEmbedding,
      cellSetLegendsData,
    } = generateCategoricalEmbeddingData(cellSets, config.selectedSample, config.selectedCellSet, embeddingData);
    const trajectoryData = generateTrajectoryPathData(plotData);

    setPlotSpec(generateSpec(config, plotEmbedding, trajectoryData, cellSetLegendsData));
  }, [config, cellSets, embeddingData, plotData]);

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
        <Vega spec={plotSpec} renderer='webgl' actions={actions} />
      </center>
    );
  };

  return render();
};

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  config: null,
};

export default TrajectoryAnalysisPlot;
