/* eslint-disable no-shadow */
import React from 'react';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { Provider } from 'react-redux';

import MultiViewGrid from 'components/plots/MultiViewGrid';
import generateMultiViewPlotUuid from 'utils/generateMultiViewPlotUuid';

import { makeStore } from 'redux/store';
import { updatePlotConfig } from 'redux/actions/componentConfig';
import { arrayMoveImmutable } from 'utils/array-move';

const plotUuid = 'ViolinMain';
const multiViewUuid = 'ViolinMain-MultiView';

const mockRenderPlot = (props) => {
  const { plotUuid } = props;

  return (
    <>
      {plotUuid}
    </>
  );
};

const genes = ['gene 0', 'gene 1', 'gene 2'];
const plotUuids = genes.map(
  (gene, index) => generateMultiViewPlotUuid(plotUuid, index),
);

const mockMultiViewConfig = {
  nrows: 2,
  ncols: 2,
  genes,
  plotUuids,
};

const renderMultiView = (store) => {
  render(
    <Provider store={store}>
      <MultiViewGrid
        renderPlot={mockRenderPlot}
        multiViewUuid={multiViewUuid}
      />
    </Provider>,
  );
};

let store = null;

describe('MultiView', () => {
  beforeEach(async () => {
    store = makeStore();

    await store.dispatch(updatePlotConfig(multiViewUuid, mockMultiViewConfig));
  });

  it('Renders itself and its children', async () => {
    renderMultiView(store);

    plotUuids.forEach((plotUuid) => {
      expect(screen.getByText(plotUuid)).toBeInTheDocument();
    });
  });

  it('Adds plots to multi view', async () => {
    renderMultiView(store);

    await store.dispatch(updatePlotConfig(multiViewUuid, { plotUuids: [...plotUuids, 'ViolinMain-3'] }));
    await waitFor(() => expect(screen.getByText('ViolinMain-3')).toBeInTheDocument());
  });

  it('Re-orders plots in multi view', async () => {
    renderMultiView(store);

    const multiViewContainer = document.getElementById('multiViewContainer');

    expect(multiViewContainer.textContent).toBe(plotUuids.join(''));

    const reorderedUuids = arrayMoveImmutable(plotUuids, 0, 2);

    await store.dispatch(updatePlotConfig(multiViewUuid, { plotUuids: reorderedUuids }));
    await waitFor(() => expect(multiViewContainer.textContent).toBe(reorderedUuids.join('')));
  });

  it('Removes plots from multi view', async () => {
    renderMultiView(store);

    await store.dispatch(updatePlotConfig(multiViewUuid, { plotUuids: plotUuids.slice(1) }));
    await waitForElementToBeRemoved(() => screen.getByText(plotUuids[0]));
  });
});
