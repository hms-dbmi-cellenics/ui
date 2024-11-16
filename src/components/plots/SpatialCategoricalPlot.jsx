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
import { loadOmeZarr } from 'components/data-exploration/spatial/loadOmeZarr';
import { root as zarrRoot } from 'zarrita';
import { ZipFileStore } from '@zarrita/storage';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

// Load OME-Zarr and return the pyramid and loader (an example)
const getImageUrls = async (omeZarrUrl) => {
  const omeZarrRoot = zarrRoot(ZipFileStore.fromUrl(omeZarrUrl));

  const { data } = await loadOmeZarr(omeZarrRoot);
  const base = data[0];

  const imageUrl = await imageDataToUrl(base);
  return imageUrl;
};

const imageDataToUrl = async (base) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Extract dimensions from the first channel
  const { data, width, height } = await base.getRaster({ selection: { c: 0, x: 0, y: 0 } });

  canvas.width = width;
  canvas.height = height;

  const rgbaData = new Uint8ClampedArray(width * height * 4);

  // Process each RGB channel
  await Promise.all([0, 1, 2].map(async (c) => {
    const selection = { c, x: 0, y: 0 };
    const { data: pixelData } = await base.getRaster({ selection });

    pixelData.forEach((value, i) => {
      rgbaData[i * 4 + c] = value;
    });
  }));

  // Set alpha channel to fully opaque
  rgbaData.forEach((_, i) => {
    if ((i + 1) % 4 === 0) {
      rgbaData[i] = 255;
    }
  });

  const imageDataObject = new ImageData(rgbaData, width, height);
  ctx.putImageData(imageDataObject, 0, 0);

  const imageUrl = canvas.toDataURL();
  return { imageUrl, imageWidth: width, imageHeight: height };
};

const SpatialCategoricalPlot = (props) => {
  const {
    experimentId,
    config,
    actions,
  } = props;

  // const omeZarrUrl = 'http://localhost:8000/human-lymph-node-10x-visium/data/processed/human_lymph_node_10x_visium.ome.zarr';

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

      console.log('plotData!!!');
      console.log(plotData);
      console.log(cellSetLegendsData);

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
