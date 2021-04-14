import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';
import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateDoubletScoresSpec';

import { loadEmbedding } from '../../redux/actions/embedding';
import loadCellMeta from '../../redux/actions/cellMeta';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';

const DoubletScoresPlot = (props) => {
  const {
    experimentId, config, plotData, actions,
  } = props;
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
  const plotComponent = useSelector((state) => state.componentConfig.embeddingPreviewDoubletScore);

  useEffect(() => {
    if (plotData.length) {
      return;
    }

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
    if (plotData.length) {
      setPlotSpec(generateSpec(config, plotData));
      return;
    }

    if (!embedding?.loading
      && !embedding?.error
      && !cellSets.loading
      && !cellSets.error) {
      setPlotSpec(generateSpec(config, generateData(embedding.data, doubletScores.data)));
    }
  }, [embedding?.data, doubletScores?.data, plotData]);

  const render = () => {
    if (!plotData.length && embedding?.error) {
      return (
        <PlatformError
          description={embedding?.error}
          onClick={() => { dispatch(loadEmbedding(experimentId, defaultEmbeddingType)); }}
        />
      );
    }

    if (!plotData.length && doubletScores?.error) {
      return (
        <PlatformError
          description={doubletScores?.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, dataName)); }}
        />
      );
    }

    if (!plotData.length
      && (!embedding?.data
        || doubletScores?.loading
        || embedding?.loading
        || cellSets.loading
        || !plotComponent)
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
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

DoubletScoresPlot.defaultProps = {
  plotData: null,
  actions: true,
};

export default React.memo(DoubletScoresPlot);
