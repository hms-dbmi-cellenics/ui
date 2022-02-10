import { updateLayout } from 'redux/actions/layout/index';
import _ from 'lodash';

const getSinglewindowConfig = (window) => ({
  first: window,
  second: '',
  splitPercentage: 100,
  direction: 'row',
});

const getMultipleWindowsConfig = (first, second) => ({
  first,
  second,
  splitPercentage: 60,
  direction: 'row',
});

const addWindow = (panel, window) => (dispatch, getState) => {
  const { layout } = getState();
  let newLayout;

  if (!layout.windows) {
    newLayout = {
      windows: getSinglewindowConfig(window || panel),
    };
  } else {
    newLayout = _.cloneDeep(layout);
    const allWindows = JSON.stringify(layout);

    // if the panel exists do not do anything
    if (allWindows.includes(panel)) return;

    // if the window exists - update it
    if (allWindows.includes(window)) {
      return dispatch(updateLayout(newLayout.windows, panel));
    }

    newLayout.windows.first = getMultipleWindowsConfig(layout.windows.first, window || panel);
  }
  return dispatch(updateLayout(newLayout.windows, panel));
};

export default addWindow;
