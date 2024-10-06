import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { root as zarrRoot, FetchStore } from 'zarrita';
import { loadOmeZarr } from './loadOmeZarr';

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
    experimentId, height, width, omeZarrUrl,
  } = props;

  // const dataSource = new ZarrDataSource({ url: omeZarrUrl });

  const omeZarrRoot = zarrRoot(new FetchStore(omeZarrUrl));

  const [loader, setLoader] = useState(null);

  useEffect(() => {
    loadOmeZarr(omeZarrRoot).then(setLoader);
  }, []);

  const [viewState, setViewState] = useState({
    zoom: -2.598,
    target: [
      1008.88,
      1004.69,
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
    />
  );
};

SpatialViewer.defaultProps = {};

SpatialViewer.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
  omeZarrUrl: PropTypes.string.isRequired,
};

export default SpatialViewer;
