import * as React from 'react';

// Custom useEffect hook that skips on initial render (mount).
const useLazyEffect = (cb, dep) => {
  const initializeRef = React.useRef(false);

  React.useEffect((...args) => {
    if (initializeRef.current) {
      cb(...args);
    } else {
      initializeRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dep);
};

export default useLazyEffect;
