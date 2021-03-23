import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import DataIntegration from '../../../../components/data-processing/DataIntegration/DataIntegration';
import CalculationConfig from '../../../../components/data-processing/DataIntegration/CalculationConfig';
import initialExperimentState from '../../../../redux/reducers/experimentSettings/initialState';
import initialCellSetsState from '../../../../redux/reducers/cellSets/initialState';

import { initialPlotConfigStates } from '../../../../redux/reducers/componentConfig/initialState';
import { initialEmbeddingState } from '../../../../redux/reducers/embeddings/initialState';
import generateDataProcessingPlotUuid from '../../../../utils/generateDataProcessingPlotUuid';

const dataIntegrationEmbeddingConfig = initialPlotConfigStates.dataIntegrationEmbedding;
const dataIntegrationFrequencyConfig = initialPlotConfigStates.dataIntegrationFrequency;
const dataIntegrationElbowConfig = initialPlotConfigStates.dataIntegrationElbow;

const filterName = 'dataIntegration';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockImplementation(() => ({
    query: {
      experimentId: '1234',
    },
  })),
}));

const store = mockStore({
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
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [generateDataProcessingPlotUuid(null, filterName, 0)]: {
      config: dataIntegrationFrequencyConfig,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 1)]: {
      config: dataIntegrationEmbeddingConfig,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 2)]: {
      config: dataIntegrationElbowConfig,
      plotData: [],
    },
  },
});

describe('DataIntegration', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  configure({ adapter: new Adapter() });

  it('renders correctly', () => {
    const component = mount(
      <Provider store={store}>
        <DataIntegration
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const dataIntegration = component.find(DataIntegration).at(0);
    const calculationConfig = dataIntegration.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = dataIntegration.find(Vega);

    // There are 4 plots (1 main and 3 miniatures)
    expect(plots.length).toEqual(4);
  });
});
