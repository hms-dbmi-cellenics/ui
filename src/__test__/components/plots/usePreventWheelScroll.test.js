import { renderHook } from '@testing-library/react';
import usePreventWheelScroll from 'components/plots/usePreventWheelScroll';

const setup = (enabled) => {
  const { result } = renderHook(() => usePreventWheelScroll(enabled));
  const ref = result.current; // callback ref
  const wrapper = document.createElement('div');
  const canvas = document.createElement('canvas');
  wrapper.appendChild(canvas);
  document.body.appendChild(wrapper);
  return { ref, wrapper, canvas };
};

const wheelOn = (el) => {
  const evt = new WheelEvent('wheel', { bubbles: true, cancelable: true });
  el.dispatchEvent(evt);
  return evt;
};

describe('usePreventWheelScroll', () => {
  it('preventDefaults a wheel over the plot canvas (so zoom does not scroll the page)', () => {
    const { ref, wrapper, canvas } = setup(true);
    ref(wrapper);
    expect(wheelOn(canvas).defaultPrevented).toBe(true);
  });

  it('lets a wheel over the (non-canvas) wrapper through so the page can scroll', () => {
    const { ref, wrapper } = setup(true);
    ref(wrapper);
    expect(wheelOn(wrapper).defaultPrevented).toBe(false);
  });

  it('does nothing when disabled (e.g. mini previews)', () => {
    const { ref, wrapper, canvas } = setup(false);
    ref(wrapper);
    expect(wheelOn(canvas).defaultPrevented).toBe(false);
  });

  it('detaches the listener when the ref is unset', () => {
    const { ref, wrapper, canvas } = setup(true);
    ref(wrapper);
    ref(null); // element unmounts
    expect(wheelOn(canvas).defaultPrevented).toBe(false);
  });
});
