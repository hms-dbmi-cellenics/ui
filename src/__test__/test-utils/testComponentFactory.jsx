import React from 'react';
import _ from 'lodash';

const createTestComponentFactory = (Component, defaultProps = {}) => (customProps = {}) => {
  // Merge is given an empty object so that it always
  // return a new object without mutating defaultProps
  const props = _.merge(
    {},
    defaultProps,
    customProps,
  );

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...props} />;
};

export default createTestComponentFactory;
