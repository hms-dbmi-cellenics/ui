import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiViewGrid from 'components/plots/MultiViewGrid';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

// Mock the named exports of the action creators
jest.mock('redux/actions/componentConfig/loadConditionalComponentConfig', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ type: 'MOCK_LOAD_CONDITIONAL_COMPONENT_CONFIG' }),
}));

jest.mock('redux/actions/componentConfig/savePlotConfig', () => ({
  savePlotConfig: jest.fn().mockReturnValue({ type: 'MOCK_SAVE_PLOT_CONFIG' }),
}));

const mockStore = configureMockStore([thunk]);

describe('MultiViewGrid', () => {
  let store;
  const multiViewConfig = {
    plotUuids: ['ViolinMain-0', 'ViolinMain-1', 'ViolinMain-2'],
    nrows: 1,
    ncols: 3,
  };
  let plotConfigs;
  const experimentId = 'experiment1';
  const plotUuid = 'ViolinMain';
  const plotType = 'violin';
  const multiViewUuid = 'multiView-violin';

  beforeEach(() => {
    store = mockStore({
      componentConfig: {
        [multiViewUuid]: { config: multiViewConfig },
      },
      genes: {
        properties: {
          views: {
            [plotUuid]: { data: ['gene1'] },
          },
        },
        expression: {
          full: {
            matrix: {
              geneIsLoaded: () => true,
            },
          },
        },
      },
      embeddings: {},
      cellSets: { accessible: true },
    });

    plotConfigs = {
      'ViolinMain-0': { shownGene: 'gene1' },
      'ViolinMain-1': { shownGene: 'gene2' },
      'ViolinMain-2': { shownGene: 'gene3' },
    };
    // act(() => {

    // });
  });

  const renderComponent = () => {
    render(
      <Provider store={store}>
        <MultiViewGrid
          experimentId={experimentId}
          renderPlot={(uuid) => <div>{uuid}</div>}
          updateAllWithChanges={() => {}}
          plotType={plotType}
          plotUuid={plotUuid}
        />
      </Provider>,
    );
  };
  it('Renders itself and its children', async () => {
    await renderComponent();
    await waitFor(() => {
      multiViewConfig.plotUuids.forEach((uuid) => {
        expect(screen.getByText(uuid)).toBeInTheDocument();
      });
    });
  });

  it('Re-orders plots in multi view', async () => {
    await renderComponent();

    const reorderedUuids = ['ViolinMain-0', 'ViolinMain-1', 'ViolinMain-2'];
    multiViewConfig.plotUuids = reorderedUuids;

    const multiViewContainer = document.getElementById('multiViewContainer');
    expect(multiViewContainer.textContent).toBe(reorderedUuids.join(''));
  });
  it('Removes plots from multi view', async () => {
    await renderComponent();

    const newUuids = multiViewConfig.plotUuids.slice(1);
    multiViewConfig.plotUuids = newUuids;

    const multiViewContainer = document.getElementById('multiViewContainer');
    expect(multiViewContainer.textContent).toBe('ViolinMain-0ViolinMain-1ViolinMain-2');
  });
});
