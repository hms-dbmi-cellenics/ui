import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateMitochondrialContentSpec';
import loadCellMeta from '../../redux/actions/cellMeta';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';

const MitochondrialContentPlot = (props) => {
  const {
    experimentId, config, actions, plotUuid,
  } = props;
  const dataName = 'mitochondrialContent';

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const mitochondrialContent = useSelector((state) => state.cellMeta?.mitochondrialContent);
  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );
  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings.method]) || {};

  const [plotSpec, setPlotSpec] = useState({});
  const plotComponent = useSelector(
    (state) => state.componentConfig[plotUuid],
  );

  useEffect(() => {
    if (mitochondrialContent.loading && !mitochondrialContent.error) {
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
      && !mitochondrialContent.loading
      && !mitochondrialContent.error
      && mitochondrialContent.data.length > 0) {
      return;
    }

    setPlotSpec(generateSpec(config, mitochondrialContent.data));
  }, [config, mitochondrialContent.data]);

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
            mitochondrialContent.data,
            embeddingData,
          ),
        ),
      );
    }
  }, [config, embeddingData, cellSets, embeddingLoading]);

  const render = () => {
    if (mitochondrialContent.error) {
      return (
        <PlatformError
          description={mitochondrialContent?.error}
          onClick={() => { dispatch(loadCellMeta(experimentId, dataName)); }}
        />
      );
    }

    if (
      mitochondrialContent?.loading || !plotComponent
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

MitochondrialContentPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

MitochondrialContentPlot.defaultProps = {
  actions: true,
};

export default MitochondrialContentPlot;
