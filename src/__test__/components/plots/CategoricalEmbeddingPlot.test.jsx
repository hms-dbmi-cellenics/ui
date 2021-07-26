import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { Vega } from 'react-vega';

import { ClipLoader } from 'react-spinners';

import CategoricalEmbeddingPlot from '../../../components/plots/CategoricalEmbeddingPlot';
import { initialEmbeddingState } from '../../../redux/reducers/embeddings/initialState';
import initialCellSetsState from '../../../redux/reducers/cellSets/initialState';
import generateExperimentSettingsMock from '../../test-utils/experimentSettings.mock';
import { initialPlotConfigStates } from '../../../redux/reducers/componentConfig/initialState';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

describe('Categorical embedding', () => {
  const emptyStore = {
    cellSets: {
      ...initialCellSetsState,
    },
    embeddings: initialEmbeddingState,
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
          cellIds: new Set(),
        },
        'test-1': {
          name: 'Test-1',
          cellIds: new Set([1, 2, 3]),
        },
        'test-2': {
          name: 'Test-1',
          cellIds: new Set([4, 5, 6]),
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
    experimentSettings: {
      ...initialExperimentState,
    },
  };

  configure({ adapter: new Adapter() });

  const config = initialPlotConfigStates.embeddingCategorical;

  it('shows spinner when data is still loading', () => {
    const store = mockStore(emptyStore);

    const component = mount(
      <Provider store={store}>
        <CategoricalEmbeddingPlot
          experimentId='asd'
          config={config}
        />
      </Provider>,
    );

    const spin = component.find(ClipLoader);

    // There should be a spinner for loading state.
    expect(spin.length).toEqual(1);
  });

  it('renders correctly when data is in the store', () => {
    const store = mockStore(mockedStore);

    const component = mount(
      <Provider store={store}>
        <CategoricalEmbeddingPlot
          experimentId='asd'
          config={config}
        />
      </Provider>,
    );

    // There should no spinner anymore.
    const spin = component.find(ClipLoader);
    expect(spin.length).toEqual(0);

    // There should be a form loaded.
    const form = component.find(Vega);
    expect(form.length).toBeGreaterThan(0);
  });
});
