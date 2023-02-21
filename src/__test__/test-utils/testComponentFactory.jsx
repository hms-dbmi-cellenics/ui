import React from 'react';
import _ from 'lodash';

import { wrapWithTestBackend } from 'react-dnd-test-utils';

const createTestComponentFactory = (Component, defaultProps = {}) => (customProps = {}) => {
  // Merge is given an empty object so that it always
  // return a new object without mutating defaultProps
  const props = _.merge(
    {},
    defaultProps,
    customProps,
  );

  const [ComponentWithContext, getBackend] = wrapWithTestBackend(Component);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <ComponentWithContext {...props} />;
};

export default createTestComponentFactory;
