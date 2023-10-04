import _ from 'lodash';
import { useRef } from 'react';
import useConditionalEffect from './useConditionalEffect';

// Custom useEffect hook that runs only once, it expects the effect callback to return a bool
// If the callback returns false, then it assumes it didn't run and will keep calling
// If the callback returns true, then it assumes it did run and won't ever run it again
//
// The bool return mechanism is to allow the caller to have custom checks if they need to wait for
// some condition to be met
const useRunOnceEffect = (callback, dependencies, optionals = {}) => {
  const alreadyRanRef = useRef(false);

  const runOnceCallback = () => {
    if (alreadyRanRef.current) return;

    const ran = callback();

    if (_.isNil(ran)) {
      throw new Error('The function passed to useRunOnceEffect has to always return a bool, either true or false');
    }

    alreadyRanRef.current = ran;
  };

  useConditionalEffect(runOnceCallback, dependencies, optionals);
};

export default useRunOnceEffect;
