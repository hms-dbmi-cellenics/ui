import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { fastLoad } from '../Loader';

import { generateSpec, generateData } from '../../utils/plotSpecs/generateTrajectoryAnalysisSpec';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';

const TrajectoryAnalysisPlot = (props) => {
  const {
    experimentId, config, plotUuid,
    actions,
  } = props;
  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );

  const {
    pseudotime: plotData,
    loading: trajectoryLoading,
    error: trajectoryError,
  } = useSelector(
    (state) => state.trajectoryAnalysis,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings?.method]) || {};

  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});
  const plotComponent = useSelector(
    (state) => state.componentConfig[plotUuid],
  );

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings.method));
    }
  }, [experimentId, embeddingSettings?.method]);

  useEffect(() => {
    if (!embeddingLoading
      && !embeddingError
      && config
      && !trajectoryLoading
      && !trajectoryError
      && !cellSets.loading
      && !cellSets.error
      && embeddingData?.length) {
      setPlotSpec(
        generateSpec(
          config,
          generateData(
            cellSets,
            config.rootNode,
            plotData['1'],
            embeddingData,
          ),
        ),
      );
    }
  }, [config, plotData, embeddingData, cellSets, embeddingLoading]);

  const render = () => {
    if (embeddingLoading || trajectoryLoading || !plotComponent) {
      return (
        <center>
          {fastLoad()}
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' actions={actions} />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

TrajectoryAnalysisPlot.defaultProps = {
  actions: true,
};

TrajectoryAnalysisPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

export default TrajectoryAnalysisPlot;
