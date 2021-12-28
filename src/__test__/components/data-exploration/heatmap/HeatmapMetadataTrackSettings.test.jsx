import React from 'react';
import '__test__/test-utils/setupTests';

import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
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
  console.log('HOLA1');
  enableFetchMocks();
  console.log('HOLA2');
  fetchMock.resetMocks();
  console.log('HOLA3');
  fetchMock.doMock();

  console.log('HOLA4');

  fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID, fake.PROJECT_ID)));

  console.log('HOLA5');

  storeState = makeStore();

  console.log('HOLA6');

  await storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));

  console.log('HOLA7');

  await storeState.dispatch(loadComponentConfig(fake.EXPERIMENT_ID, componentType, componentType));

  console.log('HOLA8');

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
      ['louvain clusters', 'Custom cell sets', 'Samples'],
      [true, false, false],
      items,
    );
  });

  it('Can enable and reorder correctly', async () => {
    await loadAndRenderDefault();

    console.log('HOLA10');

    let items = screen.getAllByTestId('reorderableListItem');

    console.log('HOLA11');

    // When samples is enabled
    act(() => {
      userEvent.click(within(items[2]).getByRole('switch'));
    });

    console.log('HOLA12');

    items = screen.getAllByTestId('reorderableListItem');

    console.log('HOLA13');

    checkReorderableListState(
      ['louvain clusters', 'Samples', 'Custom cell sets'],
      [true, true, false],
      items,
    );

    console.log('HOLA14');

    // When louvain is moved down
    act(() => {
      const downButton = within(items[0]).getAllByRole('button')[1];

      userEvent.click(downButton);
    });

    items = screen.getAllByTestId('reorderableListItem');

    // Louvain is now second
    checkReorderableListState(
      ['Samples', 'louvain clusters', 'Custom cell sets'],
      [true, true, false],
      items,
    );

    // When louvain is attempted to be moved down again
    items = screen.getAllByTestId('reorderableListItem');
    act(() => {
      const downButton = within(items[1]).getAllByRole('button')[1];

      userEvent.click(downButton);
    });

    console.log('HOLA15');

    items = screen.getAllByTestId('reorderableListItem');

    // Nothing changes, because custom cell sets is disabled
    checkReorderableListState(
      ['Samples', 'louvain clusters', 'Custom cell sets'],
      [true, true, false],
      items,
    );
  });
});
