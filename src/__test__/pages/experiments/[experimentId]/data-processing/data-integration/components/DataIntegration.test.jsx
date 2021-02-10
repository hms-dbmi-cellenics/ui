import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Vega } from 'react-vega';

import DataIntegration from '../../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/DataIntegration';
import CalculationConfig from '../../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/CalculationConfig';
import initialExperimentState from '../../../../../../../redux/reducers/experimentSettings/initialState';

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
  experimentSettings: {
    ...initialExperimentState,
  },
});

describe('DataIntegration', () => {
  configure({ adapter: new Adapter() });

  beforeEach(async () => {
    await preloadAll();

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
  });
});
