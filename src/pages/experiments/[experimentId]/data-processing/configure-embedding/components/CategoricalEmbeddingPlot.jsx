import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import { Vega } from 'react-vega';

import PlatformError from '../../../../../../components/PlatformError';
import { generateSpec, generateData } from '../../../../../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from '../../../../../../redux/actions/embedding';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';

const CategoricalEmbeddingPlot = (props) => {
  const { experimentId, config, plotUuid } = props;
  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const embeddingType = useSelector((state) => state.experimentSettings.processing.configureEmbedding?.embeddingSettings.method);
  const { data: embeddingData, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (!embeddingData) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }

    if (!cellSets.hierarchy.length) {
      dispatch(loadCellSets(experimentId));
    }

    if (cellSets.hierarchy.length && embeddingData) {
      setPlotSpec(generateData(generateSpec(config), cellSets, config.selectedCellSet, embeddingData));
    }
  }, [cellSets, embeddingData, embeddingType]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingType)); }}
        />
      );
    }

    if (cellSets.loading || !embeddingData || loading) {
      return (
        <center>
          <Spin size='large' />
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

CategoricalEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.object.isRequired,
};

export default CategoricalEmbeddingPlot;
