import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateDoubletScoresSpec';
import loadCellMeta from '../../redux/actions/cellMeta';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';

const DoubletScoresPlot = (props) => {
  const {
    experimentId, config, actions, plotUuid,
  } = props;
  const dataName = 'doubletScores';

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const doubletScores = useSelector((state) => state.cellMeta?.doubletScores);
  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );
  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings.method]) || {};

  const [plotSpec, setPlotSpec] = useState({});
  const plotComponent = useSelector((state) => state.componentConfig[plotUuid]);

  useEffect(() => {
    if (doubletScores.loading && !doubletScores.error) {
      dispatch(loadCellMeta(experimentId, dataName));
    }
  }, [experimentId]);

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings.method));
    }
  }, [experimentId, embeddingSettings.method]);

  useEffect(() => {
    if (!config
      && !doubletScores.loading
      && !doubletScores.error
      && doubletScores.data.length > 0) {
      return;
    }

    setPlotSpec(generateSpec(config, doubletScores.data));
  }, [config, doubletScores.data]);

  useEffect(() => {
    if (!embeddingLoading
      && !embeddingError
      && embeddingData?.length > 0
      && config
      && !cellSets.loading
      && !cellSets.error) {
      setPlotSpec(
        generateSpec(
          config,
          generateData(
            cellSets,
            config.selectedSample,
            doubletScores.data,
            embeddingData,
          ),
        ),
      );
    }
  }, [config, embeddingData, cellSets, embeddingLoading]);

  const render = () => {
    if (doubletScores.error) {
      return (
        <PlatformError
          description={doubletScores?.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, dataName)); }}
        />
      );
    }

    if (
      doubletScores?.loading || !plotComponent
    ) {
      return (
        <center>
          <Skeleton.Image style={{ width: 400, height: 400 }} />
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
      { render()}
    </>
  );
};

DoubletScoresPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

DoubletScoresPlot.defaultProps = {
  actions: true,
};

export default DoubletScoresPlot;
