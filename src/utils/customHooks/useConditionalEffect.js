import _ from 'lodash';
import React, { useRef } from 'react';

// Custom useEffect hook that runs only when
// a comparator notices a difference between one of the dependencies previous and new values
// By default, the comparator used is _.isEqual
// It can be set as lazy (so that it doesnt run on the first render)
const useConditionalEffect = (callback, dependencies, optionals = {}) => {
  const { comparator = _.isEqual, lazy = false } = optionals;

  const firstRenderRef = useRef(true);
  const dependenciesRef = useRef(dependencies);

  React.useEffect((...args) => {
    const somethingChanged = !comparator(dependenciesRef.current, dependencies);

    if ((firstRenderRef.current && !lazy) || somethingChanged) {
      callback(...args);
    }

    dependenciesRef.current = dependencies;
    firstRenderRef.current = false;
  }, dependencies);
};

export default useConditionalEffect;
