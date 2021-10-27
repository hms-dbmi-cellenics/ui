import React from 'react';
import _ from 'lodash';

const testComponentFactory = (Component, defaultProps) => (customProps = {}) => {
  const props = _.merge(
    defaultProps,
    customProps,
  );

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...props} />;
};

export default testComponentFactory;
