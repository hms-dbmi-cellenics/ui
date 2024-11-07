import React, {
  useEffect, useState, useCallback,
} from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { root as zarrRoot } from 'zarrita';
import { ZipFileStore } from '@zarrita/storage';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import { loadOmeZarrGrid } from './loadOmeZarr';

import ExampleData from './ExampleData';

const Spatial = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Spatial),
  { ssr: false },
);

const imageLayerDefs = [
  {
    channels: [
      {
        color: [
          255,
          0,
          0,
        ],
        selection: {
          c: 0,
        },
        slider: [
          0,
          255,
        ],
        visible: true,
      },
      {
        color: [
          0,
          255,
          0,
        ],
        selection: {
          c: 1,
        },
        slider: [
          0,
          255,
        ],
        visible: true,
      },
      {
        color: [
          0,
          0,
          255,
        ],
        selection: {
          c: 2,
        },
        slider: [
          0,
          255,
        ],
        visible: true,
      },
    ],
    colormap: null,
    transparentColor: null,
    index: 0,
    opacity: 1,
    domainType: 'Min/Max',
    type: 'raster',
  },
];

const SpatialViewer = (props) => {
  const {
    experimentId, height, width,
  } = props;

  // shallowEqual prevents new object returned every time state updates
  const sampleIdsForFileUrls = useSelector((state) => Object.values(state.samples)
    .map((sample) => sample.uuid).filter(Boolean),
  shallowEqual);

  const isObj2s = useSelector((state) => state.backendStatus[experimentId].status.obj2s.status !== null);

  const getExpressionValue = useCallback(() => { }, []);

  const [omeZarrSampleIds, setOmeZarrSampleIds] = useState(null);
  const [omeZarrUrls, setOmeZarrUrls] = useState(null);
  const [loader, setLoader] = useState(null);

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
    if (!omeZarrUrls) return; // Exit early if there are no URLs

    // Create Zarr roots for each URL
    const omeZarrRoots = omeZarrUrls.map((url) => zarrRoot(ZipFileStore.fromUrl(url)));

    // Determine grid size
    const numColumns = Math.min(omeZarrUrls.length, 4);
    const numRows = Math.ceil(omeZarrUrls.length / numColumns);

    // Load the datasets
    loadOmeZarrGrid(omeZarrRoots, [numRows, numColumns]).then(setLoader);
  }, [omeZarrUrls]);

  const [viewState, setViewState] = useState({
    zoom: -2,
    target: [
      500,
      300,
      null,
    ],
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    rotationOrbit: 0,
    orbitAxis: 'Y',
  });

  if (!loader) return null;

  return (
    <Spatial
      viewState={viewState}
      setViewState={setViewState}
      uuid='spatial-0'
      width={width}
      height={height}
      theme='light'
      imageLayerLoaders={{ 0: loader }}
      imageLayerDefs={imageLayerDefs}
      // obsCentroids={ExampleData.obsCentroids}
      // obsCentroidsIndex={ExampleData.obsCentroidsIndex}
      // obsSegmentations={ExampleData.obsSegmentations}
      // obsSegmentationsIndex={ExampleData.obsSegmentationsIndex}
      // obsSegmentationsLayerDefs={ExampleData.obsSegmentationsLayerDefs}
      // obsSegmentationsType={ExampleData.obsSegmentationsType}
      // cellSelection={ExampleData.cellSelection}
      // cellColors={ExampleData.cellColors}
      // cellColorEncoding={ExampleData.cellColorEncoding}
      // getExpressionValue={getExpressionValue}
      // geneExpressionColormapRange={ExampleData.geneExpressionColormapRange}
      // geneExpressionColormap={ExampleData.geneExpressionColormap}
    />
  );
};

SpatialViewer.defaultProps = {};

SpatialViewer.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
};

export default SpatialViewer;
