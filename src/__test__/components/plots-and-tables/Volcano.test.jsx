import React from 'react';
import { screen, render } from '@testing-library/react';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import thunk from 'redux-thunk';
import VolcanoPlot from '../../../pages/experiments/[experimentId]/plots-and-tables/volcano/index';
import {
  initialPlotConfigStates,
} from '../../../redux/reducers/componentConfig/initialState';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);
const experimentId = 'insaneExperiment';
const plotUuid = 'volcanoPlotMain';
const dataState = {
  cellSets: {
    hierarchy: [
      {
        key: 'louvain',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
        ],
      },
      {
        key: 'sample',
        children: [
          {
            key: 'someSample',
          },
        ],
      }],
    properties: {
      louvain: {
        name: 'louvain clusters',
        cellIds: 'Set()',
        rootNode: true,
        type: 'cellSets',
      },
      'louvain-0': {
        name: 'Cluster 0',
        color: '#e377c2',
        cellIds: 'Set(1,5,14,22,24,26)',
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-1': {
        name: 'Cluster 1',
        color: '#e377c2',
        cellIds: 'Set(165,16,21,25,28)',
        rootNode: false,
        type: 'cellSets',
      },
      sample: {
        name: 'Samples',
        cellIds: 'Set()',
        rootNode: true,
        type: 'metadataCategorical',
      },
    },
  },
  componentConfig: {
    [plotUuid]: { config: initialPlotConfigStates.volcano, plotType: 'volcano' },
  },
  differentialExpression: {
    comparison: {
      group: {
        between: {
          cellSet: null,
          compareWith: null,
          basis: null,
        },
        within: {
          cellSet: 'louvain/louvain-0',
          compareWith: 'louvain/rest',
          basis: 'sample/someSample',
        },
      },
      type: 'within',
    },
    properties: {
      loading: false,
      data: [],
      error: false,
      comparisonType: 'within',
      cellSets: {
        cellSet: 'louvain/louvain-0',
        compareWith: 'louvain/rest',
        basis: 'sample/someSample',
      },
    },
  },
};

describe('volcano plot tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await preloadAll();
  });

  const renderVolcano = (state) => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <VolcanoPlot experimentid={experimentId} />
      </Provider>,
    );
  };
  it('renders skeleton when there is no config', () => {
    const state = {
      ...dataState,
      componentConfig: { [plotUuid]: { config: null } },
    };
    renderVolcano(state);
    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });

  it('renders empty initially and doesnt crash if data is available', () => {
    renderVolcano(dataState);
    expect(screen.getByText('Create a comparison to get started.')).toBeDefined();
  });
});
