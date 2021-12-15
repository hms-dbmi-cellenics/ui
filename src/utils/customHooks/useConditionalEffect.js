import _ from 'lodash';
import React, { useRef } from 'react';

// Custom useEffect hook that runs only when
// a comparator notices a difference between one of the dependencies previous and new values
// By default, the comparator used is _.isEqual
const useConditionalEffect = (callback, dependencies, comparator = _.isEqual) => {
  const firstRenderRef = useRef(true);
  const dependenciesRef = useRef(dependencies);

  React.useEffect((...args) => {
    const somethingChanged = _.some(
      dependenciesRef.current,
      (currDependency, index) => !comparator(currDependency, dependencies[index]),
    );

    if (firstRenderRef.current || somethingChanged) {
      callback(...args);
    }

    dependenciesRef.current = dependencies;
    firstRenderRef.current = false;
  }, dependencies);
};

export default useConditionalEffect;
