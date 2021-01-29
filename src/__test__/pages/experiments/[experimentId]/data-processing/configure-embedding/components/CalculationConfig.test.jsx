import React from 'react';
import {
  Select, InputNumber, Spin, Form, Alert, Button,
} from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import waitForActions from 'redux-mock-store-await-actions';
import { EXPERIMENT_SETTINGS_PROCESSING_SAVE, EXPERIMENT_SETTINGS_PROCESSING_UPDATE } from '../../../../../../../redux/actionTypes/experimentSettings';
import { EMBEDDINGS_LOADING } from '../../../../../../../redux/actionTypes/embeddings';

import CalculationConfig from '../../../../../../../pages/experiments/[experimentId]/data-processing/configure-embedding/components/CalculationConfig';
import { initialEmbeddingState } from '../../../../../../../redux/reducers/embeddings/initialState';
import initialExperimentState, { initialProcessingState } from '../../../../../../../redux/reducers/experimentSettings/initialState';

jest.mock('localforage');
enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('CalculationConfig', () => {
  const storeState = {
    embeddings: initialEmbeddingState,
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

    const spin = component.find(Spin);

    // There should be a spinner for loading state.
    expect(spin.length).toEqual(1);
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

  it('changing an embedding setting should trigger an alert', () => {
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

    // There should be no alert loaded.
    let alert = component.find(Alert);
    expect(alert.length).toEqual(0);

    // The Apply button should be disabled.
    let button = component.find(Button);
    expect(button.at(0).getElement().props.disabled).toEqual(true);

    // Switching the embedding type...
    component.find(Select).at(0).getElement().props.onChange('tsne');
    component.update();

    // The alert should appear.
    alert = component.find(Alert);
    expect(alert.length).toEqual(1);

    // The button should enable.
    button = component.find(Button);
    expect(button.at(0).getElement().props.disabled).toEqual(false);
  });

  it('clicking on button triggers save action', async () => {
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

    // Switching the embedding type...
    component.find(Select).at(0).getElement().props.onChange('tsne');
    component.update();

    // ... and clicking the Apply button.
    const button = component.find(Button);
    button.simulate('click', {});

    // // Should update and save the config.
    await waitForActions(store,
      [EMBEDDINGS_LOADING,
        EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
        EXPERIMENT_SETTINGS_PROCESSING_SAVE]);

    expect(store.getActions().length).toEqual(4);

    // First there should be a reload of the embedding...
    const reloadEmbedding = store.getActions()[0];
    expect(reloadEmbedding.type).toBe(EMBEDDINGS_LOADING);
    expect(reloadEmbedding).toMatchSnapshot();

    // First there should be an update...
    const updateAction = store.getActions()[1];
    expect(updateAction.type).toBe(EXPERIMENT_SETTINGS_PROCESSING_UPDATE);
    expect(updateAction).toMatchSnapshot();

    // ... then there should be a save.
    const saveAction = store.getActions()[2];
    expect(saveAction.type).toBe(EXPERIMENT_SETTINGS_PROCESSING_SAVE);
    expect(saveAction).toMatchSnapshot();
  });

  it('Embeddings should reload as input is changed', async () => {
    const store = mockStore({
      ...storeState,
      experimentSettings: {
        ...storeState.experimentSettings,
        processing: {
          ...storeState.experimentSettings.processing,
          configureEmbedding: {
            ...storeState.experimentSettings.processing.configureEmbedding,
            embeddingSettings: {
              ...storeState.experimentSettings.processing.configureEmbedding.embeddingSettings,
              method: 'tsne',
            },
          },
        },
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

    // Modifying input
    component.find(InputNumber).at(0).getElement().props.onInput({ target: { value: 1 } });
    component.update();

    // Should trigger updates and embeeding loading
    await waitForActions(store, [EMBEDDINGS_LOADING, EXPERIMENT_SETTINGS_PROCESSING_UPDATE]);

    // There should be 2 actions
    expect(store.getActions().length).toEqual(2);

    // First there should be a reload of the map, then an update...
    const reloadEmbedding1 = store.getActions()[0];
    expect(reloadEmbedding1.type).toBe(EMBEDDINGS_LOADING);
    expect(reloadEmbedding1).toMatchSnapshot();

    // Then update
    const updateAction1 = store.getActions()[1];
    expect(updateAction1.type).toBe(EXPERIMENT_SETTINGS_PROCESSING_UPDATE);
    expect(updateAction1).toMatchSnapshot();
  });
});
