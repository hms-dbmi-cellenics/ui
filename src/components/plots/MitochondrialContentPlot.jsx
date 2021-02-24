import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateMitochondrialContentSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import loadCellMeta from '../../redux/actions/cellMeta';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';

const MitochondrialContentPlot = (props) => {
  const { experimentId, config } = props;
  const defaultEmbeddingType = 'umap';
  const plotName = 'mitochondrialContent';

  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );
  const embedding = useSelector((state) => state.embeddings[embeddingSettings.method]) || {};

  const mitochondrialContent = useSelector((state) => state.cellMeta?.mitochondrialContent) || {};
  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId, defaultEmbeddingType));
    }

    if (!embedding.data && embeddingSettings.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings.method));
    }

    if (mitochondrialContent) {
      dispatch(loadCellMeta(experimentId, plotName));
    }
  }, [experimentId, embeddingSettings.method]);

  useEffect(() => {
    if (!embedding.loading
      && !embedding.error
      && !cellSets.loading
      && !cellSets.error) {
      setPlotSpec(generateData(generateSpec(config), mitochondrialContent, embedding.data));
    }
  }, [embedding.data, mitochondrialContent]);

  const render = () => {
    if (embedding.error) {
      return (
        <PlatformError
          description={embedding.error}
          onClick={() => { dispatch(loadEmbedding(experimentId, defaultEmbeddingType)); }}
        />
      );
    }

    if (mitochondrialContent.error) {
      return (
        <PlatformError
          description={mitochondrialContent.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, plotName)); }}
        />
      );
    }

    if (!embedding.data
      || mitochondrialContent.loading.length
      || embedding.loading
      || cellSets.loading) {
      return (
        <Spin size='large' />
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

MitochondrialContentPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
};

export default MitochondrialContentPlot;
