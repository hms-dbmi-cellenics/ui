import React from 'react';
import {
  Spin, Form, Select, Alert, Button,
} from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import waitForActions from 'redux-mock-store-await-actions';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CalculationConfig from '../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/CalculationConfig';
import initialExperimentState from '../../../../../../redux/reducers/experimentSettings/initialState';
import {
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
} from '../../../../../../redux/actionTypes/experimentSettings';

jest.mock('localforage');
enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('Data Integration Calculation Config', () => {
  const storeState = {
    experimentSettings: {
      ...initialExperimentState,
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
            { ...initialExperimentState },
        },
      ),
    );

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(response);
  });

  const experimentId = '1234';
  const config = storeState.experimentSettings.processing.dataIntegration;

  it('renders correctly when nothing is loaded', () => {
    const store = mockStore({
      embeddings: {},
      experimentSettings: {
        ...initialExperimentState,
      },
    });

    const component = mount(
      <Provider store={store}>
        <CalculationConfig experimentId={experimentId} config={config} />
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
        <CalculationConfig experimentId={experimentId} config={config} />
      </Provider>,
    );

    // There should no spinner anymore.
    const spin = component.find(Spin);
    expect(spin.length).toEqual(0);

    // There should be a form loaded.
    const form = component.find(Form);
    expect(form.length).toBeGreaterThan(0);
  });

  it('shows settings changed warning when the settings is changed', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig experimentId={experimentId} config={config} />
      </Provider>,
    );

    component.find(Select).at(0).getElement().props.onChange('seuratv3');
    component.update();

    expect(component.find(Alert).length).toEqual(1);
  });

  it('fires action to update config settings when options are changed', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig experimentId={experimentId} config={config} />
      </Provider>,
    );

    component.find(Select).at(0).getElement().props.onChange('seuratv3');
    component.update();

    const actions = store.getActions();
    expect(actions.length).toEqual(1);

    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_UPDATE);
  });

  it('button is disabled if there are no changes', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig experimentId={experimentId} config={config} />
      </Provider>,
    );

    const button = component.find(Button).at(0).getElement();
    expect(button.props.disabled).toBe(true);
  });

  it('fires action to save config when run is pressed', async () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig experimentId={experimentId} config={config} />
      </Provider>,
    );

    component.find(Select).at(0).getElement().props.onChange('seuratv3');
    component.update();

    expect(component.find(Alert).length).toEqual(1);

    // Simulate click
    const button = component.find(Button).at(0);
    button.simulate('click');
    component.update();

    // Alert disappears
    expect(component.find(Alert).length).toEqual(0);

    await waitForActions(store,
      [
        EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
        EXPERIMENT_SETTINGS_PROCESSING_SAVE,
      ]);
  });
});
