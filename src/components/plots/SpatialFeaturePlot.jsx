import React, {
  useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData } from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { loadOmeZarr, loadOmeZarrGrid } from 'components/data-exploration/spatial/loadOmeZarr';
import { root as zarrRoot, FetchStore } from 'zarrita';
import { ZipFileStore } from '@zarrita/storage';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const EMBEDDING_TYPE = 'images';

// Load OME-Zarr and return the pyramid and loader (an example)
const fetchImageData = async (omeZarrUrls, omeZarrSampleIds) => {
  const omeZarrRoots = omeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));

  const imageDatas = await Promise.all(omeZarrRoots.map(async (omeZarrRoot, ind) => {
    const { data } = await loadOmeZarr(omeZarrRoot);
    const base = data[0];

    const imageData = await processImageData(base);
    imageData.sampleId = omeZarrSampleIds[ind];
    return imageData;
  }));
  return imageDatas;
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
  return { imageUrl, imageWidth: width, imageHeight: height };
};

const SpatialFeaturePlot = forwardRef((props, ref) => {
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

  // const omeZarrUrl = 'http://localhost:8000/human-lymph-node-10x-visium/data/processed/human_lymph_node_10x_visium.ome.zarr';

  const dispatch = useDispatch();

  const viewStateRef = useRef({ xdom: [-2, 2], ydom: [-2, 2] });
  const previousAxisSettings = useRef({
    xAxisAuto: null,
    xMin: null,
    xMax: null,
    yAxisAuto: null,
    yMin: null,
    yMax: null,
  });

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
  const [forceReset, setForceReset] = useState(0);
  const [imageDatas, setImageDatas] = useState(null);
  const [omeZarrSampleIds, setOmeZarrSampleIds] = useState(null);
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const results = (await Promise.all(
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'ome_zarr_zip')),
        )).flat();

        const signedUrls = results.map(({ url }) => url);
        setOmeZarrUrls(signedUrls);

        if (isObj2s) {
          // For obj2s, file IDs correspond to sample IDs
          // whereas there is a single dummy sample ID in state
          const fileIds = results.map(({ fileId }) => fileId);
          setOmeZarrSampleIds(fileIds);
        } else {
          setOmeZarrSampleIds(sampleIdsForFileUrls);
        }
      } catch (error) {
        console.error('Error fetching URLs:', error);
      }
    })(); // Immediately invoked function expression (IIFE)
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  useEffect(() => {
    if (!omeZarrUrls) return;
    const loadImageData = async () => {
      const imageDatas = await fetchImageData(omeZarrUrls, omeZarrSampleIds); // Update with actual path
      setImageDatas(imageDatas);
    };

    loadImageData();
  }, [omeZarrUrls]);

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

  // Add/subtract 1 to give some padding to the plot
  const extent = (arr) => [_.min(arr) - 1, _.max(arr) + 1];

  const xExtent = useMemo(() => {
    if (!embeddingData) return [-10, 10];
    return extent(embeddingData.filter((data) => data !== undefined).map((data) => data[0]));
  }, [embeddingData]);

  const yExtent = useMemo(() => {
    if (!embeddingData) return [-10, 10];
    return extent(embeddingData.filter((data) => data !== undefined).map((data) => data[1]));
  }, [embeddingData]);

  useImperativeHandle(ref, () => ({
    resetZoom() {
      viewStateRef.current = { xdom: xExtent, ydom: yExtent };
      setPlotSpec(calculatePlotSpec());
      setForceReset(forceReset + 1);
    },
  }));

  useEffect(() => {
    // eslint-disable-next-line no-param-reassign
    viewStateRef.current = { xdom: xExtent, ydom: yExtent };
  }, [xExtent, yExtent]);

  const calculatePlotSpec = () => {
    const {
      xAxisAuto, yAxisAuto, xMin, xMax, yMin, yMax,
    } = config.axesRanges;

    const viewState = {};

    if (previousAxisSettings.current.xAxisAuto === xAxisAuto
      && previousAxisSettings.current.xMin === xMin
      && previousAxisSettings.current.xMax === xMax
    ) {
      viewState.xdom = viewStateRef.current.xdom;
    } else if (xAxisAuto) {
      viewState.xdom = xExtent;
    } else {
      viewState.xdom = [xMin, xMax];
    }

    if (previousAxisSettings.current.yAxisAuto === yAxisAuto
      && previousAxisSettings.current.yMin === yMin
      && previousAxisSettings.current.yMax === yMax
    ) {
      viewState.ydom = viewStateRef.current.ydom;
    } else if (yAxisAuto) {
      viewState.ydom = yExtent;
    } else {
      viewState.ydom = [yMin, yMax];
    }

    previousAxisSettings.current = config.axesRanges;

    const spec = generateSpec(
      config,
      viewState,
      EMBEDDING_TYPE,
      imageDatas,
      generateData(
        cellSets,
        config.selectedSample,
        config.truncatedValues ? truncatedPlotData : plotData,
        embeddingData,
      ),
    );

    return spec;
  };

  useEffect(() => {
    if (!embeddingLoading
      && !embeddingError
      && config
      && plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length
      && imageDatas) {
      setPlotSpec(calculatePlotSpec());
    }
  }, [
    config, plotData, embeddingData, cellSets, embeddingLoading, imageDatas,
  ]);

  const plotListeners = {
    domUpdates: (e, val) => {
      const [xdom, ydom] = val;
      // eslint-disable-next-line no-param-reassign
      viewStateRef.current = { xdom, ydom };
    },
  };

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
        <Vega reset={forceReset} spec={plotSpec || {}} actions={actions} signalListeners={plotListeners} />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
});

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
