/* eslint-disable import/prefer-default-export */
import _ from 'lodash';
import { UPDATE_LAYOUT } from '../actionTypes/layout';

const updateLayout = (layout) => (dispatch) => {
  dispatch({
    type: UPDATE_LAYOUT,
    data: {
      windows: { ...layout },
    },
  });
};

const addWindow = (window) => (dispatch, getState) => {
  const { layout } = getState();
  if (JSON.stringify(layout.windows).includes(window)) {
    return;
  }
  const newLayout = _.cloneDeep(layout);
  const newWindow = {
    first: layout.windows.first,
    second: window,
    splitPercentage: 60,
    direction: 'row',
  };
  newLayout.windows.first = newWindow;

  dispatch({
    type: UPDATE_LAYOUT,
    data: {
      ...newLayout,
    },
  });
};

const addToWindow = (panel, window) => (dispatch, getState) => {
  const { layout } = getState();
  const newLayout = _.cloneDeep(layout);
  const allWindows = JSON.stringify(newLayout);
  if (allWindows.includes(window) || allWindows.includes(panel)) {
    newLayout.panel = panel;
    return dispatch({
      type: UPDATE_LAYOUT,
      data: {
        ...newLayout,
      },
    });
  }

  const newWindow = {
    first: layout.windows.first,
    second: window,
    splitPercentage: 60,
    direction: 'row',
  };
  newLayout.windows.first = newWindow;

  dispatch({
    type: UPDATE_LAYOUT,
    data: {
      ...newLayout,
    },
  });
};

export { updateLayout, addWindow, addToWindow };
