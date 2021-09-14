import React from 'react';

import VegaEmbed from './VegaEmbed';

const Vega = (props) => {
  const a = 5;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <VegaEmbed {...props} />;
};
export default Vega;
