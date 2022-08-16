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
import { Alert } from 'antd';

import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';

const TrajectoryAnalysisPlot = (props) => {
  // Currenty monocle3 only trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const {
    experimentId,
    config,
    plotData,
    plotLoading,
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
    (state) => state.embeddings[embeddingMethod],
  ) || {};

  const [plotSpec, setPlotSpec] = useState(null);

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, [experimentId]);

  useEffect(() => {
    if (!embeddingData && embeddingMethod) {
      dispatch(loadEmbedding(experimentId, embeddingMethod));
    }
  }, [experimentId, embeddingMethod]);

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingMethod, onUpdate);
  }, [config, embeddingMethod]);

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
                Due to Monocle3 limitations, only UMAP embeddings are supported for Trajectory Analysis.
                <br />
                The embedding and trajectory below are generated from a UMAP embedding of your data.
              </>
            )}
          />
        )}
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
  plotLoading: PropTypes.bool,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
  plotLoading: false,
  config: null,
};

export default TrajectoryAnalysisPlot;
