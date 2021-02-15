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

import { initialPlotConfigStates } from '../../../../redux/reducers/componentConfig/initialState';

const dataIntegrationFrequencyConfig = initialPlotConfigStates.dataIntegrationFrequency;

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
  componentConfig: {
    dataIntegrationFrequency: {
      config: dataIntegrationFrequencyConfig,
    },
  },
  cellSets: {
    loading: false,
    error: false,
    selected: [],
    properties: {},
    hierarchy: [],
    hidden: [],
  },
  experimentSettings: {
    ...initialExperimentState,
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

    // There are 4 plots, the miniature versions and the actually shown one
    expect(plots.length).toEqual(4);

    expect(1).toEqual(1);
  });
});
