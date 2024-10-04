import React, { useEffect, useState } from 'react';
import { OmeTiffLoader } from '@hms-dbmi/viv';
import PropTypes from 'prop-types';

import dynamic from 'next/dynamic';

const Spatial = dynamic(
  () => import('../DynamicVitessceWrappers').then((mod) => mod.Spatial),
  { ssr: false },
);

const SpatialViewer = (props) => {
  const {
    experimentId, height, width, omeTiffUrl,
  } = props;

  const [imageLayerLoaders, setImageLayerLoaders] = useState(null);
  const [imageLayers, setImageLayers] = useState([]);

  useEffect(() => {
    // Function to load OME-TIFF using Viv's loader
    const loadOMEImage = async () => {
      try {
        const loader = await OmeTiffLoader.create(omeTiffUrl);

        console.log(loader);
        console.log('loader!!!!');

        // Assign the loader to a specific raster layer index (e.g., index 0)
        const loaders = {
          0: loader,
        };

        // Define the image layer configuration
        const layers = [
          {
            name: 'OME-TIFF Image',
            type: 'raster',
            channels: [
              { selection: [0], color: [255, 0, 0], visible: true }, // Red for channel 0
              { selection: [1], color: [0, 255, 0], visible: true }, // Green for channel 1
              { selection: [2], color: [0, 0, 255], visible: true }, // Blue for channel 2
            ],
            domainType: 'MinMax', // Can adjust to 'Percentile' if needed
          },
        ];

        // Set state for loaders and layers
        setImageLayerLoaders(loaders); // Avoid redeclaring, directly update state
        setImageLayers(layers);
      } catch (error) {
        console.error('Error loading OME-TIFF:', error);
      }
    };

    loadOMEImage();
  }, [omeTiffUrl]);

  if (!imageLayerLoaders) {
    return <div>Loading image...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Spatial
        imageLayerLoaders={imageLayerLoaders} // Use the state variable directly
        imageLayers={imageLayers} // Pass the image layer configuration
        height={height}
        width={width}
        uuid={`spatial-${experimentId}`}
        theme='light'
        viewState={{ zoom: -3, target: [0, 0, 0] }}
      />
    </div>
  );
};

SpatialViewer.defaultProps = {};

SpatialViewer.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
  omeTiffUrl: PropTypes.string.isRequired,
};

export default SpatialViewer;
