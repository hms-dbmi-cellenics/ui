import React from 'react';

import { render, screen, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { makeStore } from 'redux/store';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

import fake from '__test__/test-utils/constants';

import HeatmapMetadataTrackSettings from 'components/data-exploration/heatmap/HeatmapMetadataTrackSettings';

import { loadComponentConfig } from 'redux/actions/componentConfig';
import { loadCellSets } from 'redux/actions/cellSets';
import userEvent from '@testing-library/user-event';

const componentType = 'interactiveHeatmap';

let storeState = null;
const loadAndRenderDefault = async () => {
  enableFetchMocks();
  fetchMock.resetMocks();
  fetchMock.doMock();

  fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID)));

  storeState = makeStore();

  await storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));

  await storeState.dispatch(loadComponentConfig(fake.EXPERIMENT_ID, componentType, componentType));

  await act(async () => {
    render(
      <Provider store={storeState}>
        <HeatmapMetadataTrackSettings
          componentType={componentType}
        />
      </Provider>,
    );
  });
};

const checkReorderableListState = (contentList, enabledList, items) => {
  items.forEach((item, index) => {
    expect(item).toHaveTextContent(contentList[index]);

    const expectedAriaChecked = enabledList[index] ? 'true' : 'false';
    expect(within(item).getByRole('switch')).toHaveAttribute('aria-checked', expectedAriaChecked);
  });
};

describe('HeatmapMetadataTrackSettings', () => {
  it('Renders correctly', async () => {
    await loadAndRenderDefault();

    const items = screen.getAllByTestId('reorderableListItem');

    checkReorderableListState(
      ['louvain clusters', 'Custom cell sets', 'Samples', 'Track_1'],
      [true, false, false, false],
      items,
    );
  });

  it('Can enable and reorder correctly', async () => {
    await loadAndRenderDefault();

    let items = screen.getAllByTestId('reorderableListItem');

    // When samples is enabled
    act(() => {
      userEvent.click(within(items[2]).getByRole('switch'));
    });

    items = screen.getAllByTestId('reorderableListItem');

    checkReorderableListState(
      ['louvain clusters', 'Samples', 'Custom cell sets', 'Track_1'],
      [true, true, false, false],
      items,
    );

    // When louvain is moved down
    act(() => {
      const downButton = within(items[0]).getAllByRole('button')[1];

      userEvent.click(downButton);
    });

    items = screen.getAllByTestId('reorderableListItem');

    // Louvain is now second
    checkReorderableListState(
      ['Samples', 'louvain clusters', 'Custom cell sets', 'Track_1'],
      [true, true, false, false],
      items,
    );

    // When louvain is attempted to be moved down again
    items = screen.getAllByTestId('reorderableListItem');
    act(() => {
      const downButton = within(items[1]).getAllByRole('button')[1];

      userEvent.click(downButton);
    });

    items = screen.getAllByTestId('reorderableListItem');

    // Nothing changes, because custom cell sets is disabled
    checkReorderableListState(
      ['Samples', 'louvain clusters', 'Custom cell sets', 'Track_1'],
      [true, true, false, false],
      items,
    );
  });
});
