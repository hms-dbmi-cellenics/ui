import React from 'react';
import {
  Spin, Form,
} from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CalculationConfig from '../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/CalculationConfig';
import initialExperimentState, { initialProcessingState } from '../../../../../../redux/reducers/experimentSettings/initialState';

jest.mock('localforage');
enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('Data Integration Calculation Config', () => {
  const storeState = {
    experimentSettings: {
      ...initialExperimentState,
      processing: initialProcessingState,
    },
  };

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

    const response = new Response(
      JSON.stringify(
        {
          processingConfig:
            { ...initialProcessingState },
        },
      ),
    );

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(response);
  });

  it('renders correctly when nothing is loaded', () => {
    const store = mockStore({
      embeddings: {},
      experimentSettings: {
        ...initialExperimentState,
      },
    });

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    // As there is no state implemented yet
    // There should be a form loaded.
    const form = component.find(Form);
    expect(form.length).toBeGreaterThan(0);
  });

  it('renders correctly when the data is in the store', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    // There should no spinner anymore.
    const spin = component.find(Spin);
    expect(spin.length).toEqual(0);

    // There should be a form loaded.
    const form = component.find(Form);
    expect(form.length).toBeGreaterThan(0);
  });
});
