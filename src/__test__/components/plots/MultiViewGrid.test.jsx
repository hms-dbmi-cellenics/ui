/* eslint-disable no-shadow */
import React from 'react';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import { Provider } from 'react-redux';

import MultiViewGrid from 'components/plots/MultiViewGrid';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';

import { makeStore } from 'redux/store';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';
import { arrayMoveImmutable } from 'utils/array-move';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'ViolinMain';
const plotType = 'violin';
const multiViewType = 'multiView';
const multiViewUuid = 'multiView-ViolinMain';

const mockRenderPlot = jest.fn((plotUuid) => (<>{plotUuid}</>));
const mockUpdateAllWithChanges = jest.fn(() => {});

const plotUuids = [generateMultiViewGridPlotUuid(plotUuid, 0)];

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
);

const renderMultiView = (store, multiViewConfig) => {
  render(
    <Provider store={store}>
      <MultiViewGrid
        renderPlot={mockRenderPlot}
        multiViewConfig={multiViewConfig}
        updateAllWithChanges={mockUpdateAllWithChanges}
      />
    </Provider>,
  );
};

enableFetchMocks();

let store = null;
let multiViewConfig = null;

const loadComponent = async (componentUuid, type, skipAPI, customConfig) => {
  store.dispatch(
    loadConditionalComponentConfig(experimentId, componentUuid, type, skipAPI, customConfig),
  );
};

describe('MultiViewGrid', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    store = makeStore();

    const customMultiViewConfig = { plotUuids };
    await loadComponent(multiViewUuid, multiViewType, true, customMultiViewConfig);

    multiViewConfig = store.getState().componentConfig[multiViewUuid].config;

    const customPlotConfig = {
      shownGene: 'gene 1',
      title: { text: 'gene 1' },
    };
    await loadComponent(plotUuids[0], plotType, true, customPlotConfig);
  });

  it.only('Renders itself and its children', async () => {
    renderMultiView(store, multiViewConfig);

    plotUuids.forEach((plotUuid) => {
      expect(screen.getByText(plotUuid)).toBeInTheDocument();
    });
  });

  it('Adds plots to multi view', async () => {
    renderMultiView(store);

    await store.dispatch(updatePlotConfig(multiViewUuid, { plotUuids: [...plotUuids, 'ViolinMain-3'] }));
    await waitFor(() => expect(screen.getByText('ViolinMain-3')).toBeInTheDocument());

    expect(mockRenderPlot).toHaveBeenCalledTimes(4);
  });

  it('Re-orders plots in multi view', async () => {
    renderMultiView(store);

    const multiViewContainer = document.getElementById('multiViewContainer');

    expect(multiViewContainer.textContent).toBe(plotUuids.join(''));

    const reorderedUuids = arrayMoveImmutable(plotUuids, 0, 2);

    await store.dispatch(updatePlotConfig(multiViewUuid, { plotUuids: reorderedUuids }));
    await waitFor(() => expect(multiViewContainer.textContent).toBe(reorderedUuids.join('')));

    expect(mockRenderPlot).toHaveBeenCalledTimes(3);
  });

  it('Removes plots from multi view', async () => {
    renderMultiView(store);

    await store.dispatch(updatePlotConfig(multiViewUuid, { plotUuids: plotUuids.slice(1) }));
    await waitForElementToBeRemoved(() => screen.getByText(plotUuids[0]));

    expect(mockRenderPlot).toHaveBeenCalledTimes(3);
  });
});
