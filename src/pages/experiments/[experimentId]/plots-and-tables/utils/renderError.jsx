import React from 'react';

import PlatformError from '../../../../../components/PlatformError';

const renderError = (err, onTryAgain) => (
  <PlatformError
    description={err}
    onClick={() => onTryAgain()}
  />
);

export default renderError;
