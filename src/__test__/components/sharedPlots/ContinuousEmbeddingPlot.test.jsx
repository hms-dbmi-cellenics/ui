import React from 'react';
import { Spin } from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { Vega } from 'react-vega';

import ContinuousEmbeddingPlot from '../../../components/sharedPlots/ContinuousEmbeddingPlot';
import { initialEmbeddingState } from '../../../redux/reducers/embeddings/initialState';
import initialCellSetsState from '../../../redux/reducers/cellSets/initialState';
import initialGeneExpressionState, { initialExpressionState } from '../../../redux/reducers/genes/initialState';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import { initialPlotConfigStates } from '../../../redux/reducers/componentConfig/initialState';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

describe('Continuous embedding plot', () => {
  const config = initialPlotConfigStates.embeddingContinuous;

  const emptyStore = {
    cellSets: {
      ...initialCellSetsState,
    },
    embeddings: initialEmbeddingState,
    genes: {
      ...initialGeneExpressionState,
      expression: {
        loading: [],
        error: false,
        data: {
          ...initialExpressionState,
        },
      },
    },
    experimentSettings: {
      ...initialExperimentState,
    },
  };

  const mockedStore = {
    cellSets: {
      ...initialCellSetsState,
      properties: {
        test: {
          name: 'Test',
          cellIds: 'Set()',
        },
        'test-1': {
          name: 'Test-1',
          cellIds: 'Set(1, 2, 3)',
        },
        'test-2': {
          name: 'Test-1',
          cellIds: 'Set(4, 5, 6)',
        },
      },
      hierarchy: [
        {
          key: 'test',
          children: [
            { key: 'test-1' },
            { key: 'test-2' },
          ],
        },
      ],
      loading: false,
      error: false,
    },
    embeddings: {
      ...initialEmbeddingState,
      umap: {
        data: [
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
          [9, 10],
          [11, 12],
        ],
        loading: false,
        error: false,
      },
    },
    genes: {
      ...initialGeneExpressionState,
      expression: {
        loading: [],
        error: false,
        data: {
          CST3: {
            min: 1,
            max: 6,
            mean: 3.5,
            stdev: 1.870828693387,
            expression: [
              1, 2, 3, 4, 5, 6,
            ],
          },
        },
      },
    },
    experimentSettings: {
      ...initialExperimentState,
    },
  };

  configure({ adapter: new Adapter() });

  it('shows spinner when data is still loading', () => {
    const store = mockStore(emptyStore);

    const component = mount(
      <Provider store={store}>
        <ContinuousEmbeddingPlot
          config={config}
        />
      </Provider>,
    );

    const spin = component.find(Spin);

    // There should be a spinner for loading state.
    expect(spin.length).toEqual(1);
  });

  it('renders correctly when data is in the store', () => {
    const store = mockStore(mockedStore);

    const chosenStore = {
      ...config,
      shownGene: 'CST3',
    };

    const component = mount(
      <Provider store={store}>
        <ContinuousEmbeddingPlot
          config={chosenStore}
        />
      </Provider>,
    );

    // There should no spinner anymore.
    const spin = component.find(Spin);
    expect(spin.length).toEqual(0);

    // There should be a form loaded.
    const form = component.find(Vega);
    expect(form.length).toBeGreaterThan(0);
  });
});
