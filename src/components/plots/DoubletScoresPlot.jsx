import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateDoubletScoresSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import loadCellMeta from '../../redux/actions/cellMeta';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';

import Loader from '../Loader';

const DoubletScoresPlot = (props) => {
  const { experimentId, config } = props;
  const defaultEmbeddingType = 'umap';
  const dataName = 'doubletScores';

  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );
  const embedding = useSelector((state) => state.embeddings[embeddingSettings?.method]);

  const doubletScores = useSelector((state) => state.cellMeta?.doubletScores);
  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId, defaultEmbeddingType));
    }

    if (!embedding?.data && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }

    if (doubletScores?.loading && !doubletScores?.error) {
      dispatch(loadCellMeta(experimentId, dataName));
    }
  }, [experimentId, embeddingSettings?.method]);

  useEffect(() => {
    if (!embedding?.loading
      && !embedding?.error
      && !cellSets.loading
      && !cellSets.error) {
      setPlotSpec(generateData(generateSpec(config), doubletScores, embedding?.data));
    }
  }, [embedding?.data, doubletScores]);

  const render = () => {
    if (embedding?.error) {
      return (
        <PlatformError
          description={embedding?.error}
          onClick={() => { dispatch(loadEmbedding(experimentId, defaultEmbeddingType)); }}
        />
      );
    }

    if (doubletScores?.error) {
      return (
        <PlatformError
          description={doubletScores?.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, dataName)); }}
        />
      );
    }

    if (!embedding?.data
      || doubletScores?.loading
      || embedding?.loading
      || cellSets.loading) {
      return (
        <center>
          <Loader experimentId={experimentId} size='large' />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
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
};

export default DoubletScoresPlot;
