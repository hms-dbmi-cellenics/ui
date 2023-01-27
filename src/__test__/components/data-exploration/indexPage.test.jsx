import DataExploration from 'pages/experiments/[experimentId]/data-exploration/index';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { screen, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import mockAPI, {
  generateDefaultMockAPIResponses,

} from '__test__/test-utils/mockAPI';
import { makeStore } from 'redux/store';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import fake from '__test__/test-utils/constants';
import { updateFilterSettings } from 'redux/actions/experimentSettings';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

describe('Data exploration index page', () => {
  let storeState = null;
  const experimentId = fake.EXPERIMENT_ID;

  const defaultResponses = generateDefaultMockAPIResponses(experimentId);
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    storeState.dispatch(loadBackendStatus(experimentId));
  });

  const dataExplorationFactory = createTestComponentFactory(DataExploration, { experimentId, route: '/some/route/lol.com', experimentData: {} });

  const renderExplorationPage = async () => {
    await render(
      <Provider store={storeState}>
        {dataExplorationFactory()}
      </Provider>,
    );
  };
  it('Renders all the mosaic windows', async () => {
    await renderExplorationPage();

    expect(screen.getAllByText('UMAP')[0]).toHaveClass('mosaic-window-title');
    expect(screen.getAllByText('Cell sets and Metadata')[0]).toHaveClass('mosaic-window-title');
    expect(screen.getAllByText('Genes')[0]).toHaveClass('mosaic-window-title');
    expect(screen.getAllByText('Heatmap')[0]).toHaveClass('mosaic-window-title');
  });

  it('Changing method changes the embedding window title', async () => {
    await storeState.dispatch(updateFilterSettings('configureEmbedding', { embeddingSettings: { method: 'newmethod' } }));
    await renderExplorationPage();
    expect(screen.getAllByText('NEWMETHOD')[0]).toHaveClass('mosaic-window-title');
  });
});
