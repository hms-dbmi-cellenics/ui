import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  getChannelStats,
  loadOmeTiff,
  PictureInPictureViewer,
} from '@hms-dbmi/viv';

// import dynamic from 'next/dynamic';
// const Spatial = dynamic(
//   () => import('../DynamicVitessceWrappers').then((mod) => mod.Spatial),
//   { ssr: false },
// );

// Hardcoded rendering properties.
const propsOther = {
  selections: [
    { z: 0, t: 0, c: 0 },
    { z: 0, t: 0, c: 1 },
    { z: 0, t: 0, c: 2 },
  ],
  colors: [
    [0, 0, 255],
    [0, 255, 0],
    [255, 0, 0],
  ],
  contrastLimits: [
    [0, 255],
    [0, 255],
    [0, 255],
  ],
  channelsVisible: [true, true, true],
};

const SpatialViewer = (props) => {
  const {
    experimentId, height, width, omeTiffUrl,
  } = props;

  const [loader, setLoader] = useState(null);
  const [autoProps, setAutoProps] = useState(null);

  useEffect(() => {
    loadOmeTiff(omeTiffUrl).then(setLoader);
  }, []);

  async function computeProps(loaderArg) {
    if (!loaderArg) return null;
    // Use lowest level of the image pyramid for calculating stats.
    const source = loaderArg.data[loaderArg.data.length - 1];
    const stats = await Promise.all(propsOther.selections.map(async (selection) => {
      const raster = await source.getRaster({ selection });
      return getChannelStats(raster.data);
    }));
    // These are calculated bounds for the contrastLimits
    // that could be used for display purposes.
    // domains = stats.map(stat => stat.domain);

    // These are precalculated settings for the contrastLimits that
    // should render a good, "in focus" image initially.
    const contrastLimits = stats.map((stat) => stat.contrastLimits);
    const newProps = { ...propsOther, contrastLimits };
    return newProps;
  }

  useEffect(() => {
    computeProps(loader).then(setAutoProps);
  }, [loader]);

  console.log('omeTiffUrl!!!');
  console.log(omeTiffUrl);

  if (!loader || !autoProps) return null;
  return (
    <PictureInPictureViewer
      loader={loader.data}
      contrastLimits={autoProps.contrastLimits}
      // Default extension is ColorPaletteExtension so no need to specify it if
      // that is the desired rendering, using the `colors` prop.
      colors={autoProps.colors}
      channelsVisible={autoProps.channelsVisible}
      selections={autoProps.selections}
      height={height}
      width={width}
    />
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
