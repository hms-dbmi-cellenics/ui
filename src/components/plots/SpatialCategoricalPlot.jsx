import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData } from 'utils/plotSpecs/generateSpatialCategoricalSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import getImageUrls from './getImageUrls';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

const SpatialCategoricalPlot = (props) => {
  const {
    experimentId,
    config,
    actions,
  } = props;

  const dispatch = useDispatch();

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[EMBEDDING_TYPE]) || {};

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const cellSets = useSelector(getCellSets());

  const sampleIdsForFileUrls = useSelector((state) => state.experimentSettings.info.sampleIds);
  const isObj2s = useSelector((state) => state.backendStatus[experimentId].status.obj2s.status !== null);

  const [plotSpec, setPlotSpec] = useState({});
  const [imageUrls, setImageUrls] = useState({});
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);
  const [selectedSample, setSelectedSample] = useState();

  useEffect(() => {
    (async () => {
      try {
        const results = (await Promise.all(
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'ome_zarr_zip')),
        )).flat();

        // For obj2s, file IDs correspond to sample IDs
        // whereas there is a single dummy sample ID in state
        const signedUrls = results.map(({ url, fileId }, i) => ({
          url,
          sampleId: isObj2s ? fileId : sampleIdsForFileUrls[i],
        }));

        setOmeZarrUrls(signedUrls);
      } catch (error) {
        console.error('Error fetching URLs:', error);
      }
    })(); // Immediately invoked function expression (IIFE)
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  useEffect(() => {
    if (!omeZarrUrls || !config) return;

    // default to first sample
    const sampleId = config.selectedSample || omeZarrUrls[0].sampleId;
    setSelectedSample(sampleId);
  }, [config, omeZarrUrls]);

  useEffect(() => {
    if (!omeZarrUrls || !selectedSample || imageUrls[selectedSample]) return;

    const { url: selectedUrl } = omeZarrUrls.find(({ sampleId }) => sampleId === selectedSample);

    const loadImageData = async () => {
      const sampleImageData = await getImageUrls(selectedUrl);
      const newImageUrls = {
        ...imageUrls,
        [selectedSample]: sampleImageData,
      };

      setImageUrls(newImageUrls);
    };

    loadImageData();
  }, [omeZarrUrls, selectedSample]);

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, [omeZarrUrls]);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE));
    }
  }, [embeddingSettings?.method]);

  useEffect(() => {
    if (config
      && cellSets.accessible
      && embeddingData?.length
      && selectedSample
      && imageUrls[selectedSample]) {
      const {
        plotData,
        cellSetLegendsData,
      } = generateData(cellSets, selectedSample, config.selectedCellSet, embeddingData);

      setPlotSpec(generateSpec(config, EMBEDDING_TYPE, imageUrls[selectedSample], plotData, cellSetLegendsData));
    }
  }, [config, cellSets, embeddingData, config, imageUrls, selectedSample]);

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
          onClick={() => { dispatch(loadEmbedding(experimentId, EMBEDDING_TYPE)); }}
        />
      );
    }

    if (!config
      || !cellSets.accessible
      || embeddingLoading
      || Object.keys(plotSpec).length === 0) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} actions={actions} />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

SpatialCategoricalPlot.defaultProps = {
  config: null,
  actions: true,
};

SpatialCategoricalPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

export default SpatialCategoricalPlot;
