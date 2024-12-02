import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData } from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import getImageUrls from './getImageUrls';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

const SpatialFeaturePlot = (props) => {
  const {
    experimentId,
    config,
    plotData,
    truncatedPlotData,
    actions,
    loading,
    error,
    reloadPlotData,
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
    if (!embeddingLoading
      && !embeddingError
      && config
      && selectedSample
      && plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length
      && imageUrls[selectedSample]) {
      const spec = generateSpec(
        config,
        EMBEDDING_TYPE,
        imageUrls[selectedSample],
        generateData(
          cellSets,
          selectedSample,
          config.truncatedValues ? truncatedPlotData : plotData,
          embeddingData,
        ),
      );

      setPlotSpec(spec);
    }
  }, [config, plotData, embeddingData, cellSets, embeddingLoading, imageUrls, selectedSample]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { reloadPlotData(); }}
        />
      );
    }

    if (cellSets.error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { loadCellSets(experimentId); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={error}
          onClick={() => { loadEmbedding(experimentId, EMBEDDING_TYPE); }}
        />
      );
    }

    if (!config
      || loading
      || !cellSets.accessible
      || embeddingLoading
      || Object.keys(plotSpec).length === 0
      || !plotData?.length) {
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

SpatialFeaturePlot.defaultProps = {
  reloadPlotData: () => { },
  config: null,
  plotData: null,
  truncatedPlotData: null,
  actions: true,
};

SpatialFeaturePlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.array,
  truncatedPlotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  reloadPlotData: PropTypes.func,
};

export default SpatialFeaturePlot;
