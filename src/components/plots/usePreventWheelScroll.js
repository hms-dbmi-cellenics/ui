import { useRef, useCallback } from 'react';

/**
 * Returns a callback ref to attach to the element wrapping a wheel-zoomable plot.
 * It registers a NON-PASSIVE `wheel` listener that preventDefaults ONLY when the
 * pointer is over the plot canvas (where the wheel zooms) — so zooming never falls
 * through to scrolling the page, but wheeling over the surrounding (larger) wrapper
 * still scrolls the page normally. Vega's own `wheel!` handler is registered
 * passively in some browsers and lets the odd event escape, hence this guard.
 *
 * @param {boolean} enabled  attach the guard (e.g. false for non-interactive minis)
 */
const usePreventWheelScroll = (enabled = true) => {
  const cleanupRef = useRef(null);

  return useCallback((el) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (el && enabled) {
      const onWheel = (e) => {
        if (e.target instanceof Element && e.target.closest('canvas')) {
          e.preventDefault();
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      cleanupRef.current = () => el.removeEventListener('wheel', onWheel);
    }
  }, [enabled]);
};

export default usePreventWheelScroll;
