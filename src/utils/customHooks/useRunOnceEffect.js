import { useRef } from 'react';
import useConditionalEffect from './useConditionalEffect';

// Custom useEffect hook that runs only once, it expects the effect callback to return a bool
// If the callback returns false, then it assumes it didn't run and will keep calling
// If the callback returns true, then it assumes it did run
// This bool return allows caller to have custom checks if
// it needs to wait for some condition to be met
const useRunOnceEffect = (callback, dependencies, optionals = {}) => {
  const alreadyRan = useRef(false);

  const runOnceCallback = () => {
    if (alreadyRan) return;

    alreadyRan.current = callback();
  };

  useConditionalEffect(runOnceCallback, dependencies, optionals);
};

export default useRunOnceEffect;
