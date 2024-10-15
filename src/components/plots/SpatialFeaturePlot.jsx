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
import { loadOmeZarr } from 'components/data-exploration/spatial/loadOmeZarr';
import { root as zarrRoot, FetchStore } from 'zarrita';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

// Load OME-Zarr and return the pyramid and loader (an example)
const fetchImageData = async (omeZarrUrl) => {
  const omeZarrRoot = zarrRoot(new FetchStore(omeZarrUrl));

  const { data } = await loadOmeZarr(omeZarrRoot);
  const base = data[0];

  const imageUrl = await processImageData(base);

  return imageUrl;
};

const processImageData = async (base) => {
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
  return imageUrl;
};

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

  const omeZarrUrl = 'http://localhost:8000/human-lymph-node-10x-visium/data/processed/human_lymph_node_10x_visium.ome.zarr';

  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings?.method]) || {};

  const cellSets = useSelector(getCellSets());

  const [plotSpec, setPlotSpec] = useState({});

  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const loadImageData = async () => {
      const url = await fetchImageData(omeZarrUrl); // Update with actual path
      setImageUrl(url);
    };

    loadImageData();
  }, [omeZarrUrl]);

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [embeddingSettings?.method]);

  useEffect(() => {
    if (!embeddingLoading
      && !embeddingError
      && config
      && plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length) {
      setPlotSpec(
        generateSpec(
          config,
          embeddingSettings.method,
          imageUrl,
          generateData(
            cellSets,
            config.selectedSample,
            config.truncatedValues ? truncatedPlotData : plotData,
            embeddingData,
          ),
        ),
      );
    }
  }, [config, plotData, embeddingData, cellSets, embeddingLoading]);

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
          onClick={() => { loadEmbedding(experimentId, embeddingSettings?.method); }}
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
