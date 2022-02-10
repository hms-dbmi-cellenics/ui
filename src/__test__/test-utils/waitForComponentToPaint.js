// if the state changes when mounting a component, use this
import { act } from 'react-dom/test-utils';

const waitForComponentToPaint = async (wrapper) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    wrapper.update();
  });
};

export default waitForComponentToPaint;
