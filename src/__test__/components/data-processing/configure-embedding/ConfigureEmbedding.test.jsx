import ConfigureEmbedding from 'components/data-processing/ConfigureEmbedding/ConfigureEmbedding';
import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

jest.mock('redux/selectors');
const mockStore = configureStore([thunk]);
const filterName = 'configureEmbedding';
const configureEmbeddingFilterName = 'configureEmbedding-1';

const mockedStore = mockStore({
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
  cellSets: mockCellSets,
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    dataIntegrationFrequency: {
      config: dataIntegrationFrequencyConfig,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, configureEmbeddingFilterName, 1)]: {
      config: embeddingPreviewBySample,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 1)]: {
      config: dataIntegrationElbowConfig,
      plotData: [],
    },
  },
});
describe('Configure Embedding', () => {
  const renderConfigureEmbedding = () => {
    const store = mockedStore;
    const component = mount(
      <Provider store={store}>
        <DataIntegration
          experimentId='1234'
          onPipelineRun={jest.fn()}
          onConfigChange={jest.fn()}
        />
      </Provider>,
    );
  };
  it('renders correctly ', () => {

  });
});
