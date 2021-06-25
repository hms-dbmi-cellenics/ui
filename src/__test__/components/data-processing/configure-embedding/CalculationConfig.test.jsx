import React from 'react';
import {
  Select, Form, Alert, Button,
} from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import waitForActions from 'redux-mock-store-await-actions';
import { EXPERIMENT_SETTINGS_PROCESSING_UPDATE } from '../../../../redux/actionTypes/experimentSettings';
import { EMBEDDINGS_LOADING } from '../../../../redux/actionTypes/embeddings';

import CalculationConfig from '../../../../components/data-processing/ConfigureEmbedding/CalculationConfig';
import { initialEmbeddingState } from '../../../../redux/reducers/embeddings/initialState';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

jest.mock('localforage');
enableFetchMocks();
const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

describe('Data Processing CalculationConfig', () => {
  const storeState = {
    embeddings: initialEmbeddingState,
    experimentSettings: {
      ...initialExperimentState,
      backendStatus: {
        status: {
          pipeline: {
            startDate: '2020-01-01T00:00:00',
          },
        },
      },
    },
  };

  const onPipelineRun = () => {};

  configure({ adapter: new Adapter() });

  beforeEach(async () => {
    await preloadAll();

    const response = new Response(
      JSON.stringify(
        {
          processingConfig:
            { ...initialExperimentState.processing },
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
        processing: {
          ...initialExperimentState.processing,
          configureEmbedding: null,
        },
      },
    });

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          changedFilters={{ current: new Set() }}
          experimentId='1234'
          width={50}
          height={50}
          onPipelineRun={onPipelineRun}
        />
      </Provider>,
    );

    const preloadContent = component.find('PreloadContent');

    // There should be a spinner for loading state.
    expect(preloadContent.length).toEqual(1);
  });

  it('renders correctly when the data is in the store', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
          changedFilters={{ current: new Set() }}
          onPipelineRun={onPipelineRun}
        />
      </Provider>,
    );

    // There should no spinner anymore.
    const preloadContent = component.find('PreloadContent');
    expect(preloadContent.length).toEqual(0);

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
          changedFilters={{ current: new Set() }}
          onPipelineRun={onPipelineRun}
        />
      </Provider>,
    );

    // There should no spinner anymore.
    const preloadContent = component.find('PreloadContent');
    expect(preloadContent.length).toEqual(0);

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
    act(() => { component.find(Select).at(0).getElement().props.onChange('tsne'); });
    component.update();

    // The alert should appear.
    alert = component.find(Alert);
    expect(alert.length).toEqual(1);

    // The button should enable.
    button = component.find(Button);
    expect(button.at(0).getElement().props.disabled).toEqual(false);
  });

  it('clicking on button triggers save action and reloading of plot data', async () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
          changedFilters={{ current: new Set() }}
          onPipelineRun={onPipelineRun}
        />
      </Provider>,
    );

    // Switching the embedding type...
    act(() => { component.find(Select).at(0).getElement().props.onChange('tsne'); });
    component.update();

    // ... and clicking the Apply button.
    const button = component.find(Button);

    button.simulate('click', {});
    // Should load the new embedding and save the config.

    await waitForActions(store, [EXPERIMENT_SETTINGS_PROCESSING_UPDATE, EMBEDDINGS_LOADING]);
    expect(store.getActions().length).toEqual(2);
    expect(store.getActions()).toMatchSnapshot();
  });

  it('Clicking run with other filters changed triggers the pipeline', async () => {
    const store = mockStore(storeState);
    const mockOnPipelineRun = jest.fn();
    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
          changedFilters={{ current: new Set(['filter1', 'awesomeFilter']) }}
          onPipelineRun={mockOnPipelineRun}
        />
      </Provider>,
    );
    act(() => { component.find(Select).at(0).getElement().props.onChange('tsne'); });
    component.update();

    const runButton = component.find(Button);
    runButton.simulate('click');
    expect(mockOnPipelineRun).toBeCalledTimes(1);
  });

  it("Clicking run with NO other filters changed doesn't trigger the pipeline", async () => {
    const store = mockStore(storeState);
    const mockOnPipelineRun = jest.fn();
    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
          changedFilters={{ current: new Set() }}
          onPipelineRun={mockOnPipelineRun}
        />
      </Provider>,
    );
    act(() => { component.find(Select).at(0).getElement().props.onChange('tsne'); });
    component.update();

    const runButton = component.find(Button);
    runButton.simulate('click', {});
    expect(mockOnPipelineRun).toBeCalledTimes(0);
    await waitForActions(store, [EXPERIMENT_SETTINGS_PROCESSING_UPDATE, EMBEDDINGS_LOADING]);
    expect(store.getActions()[1].type).toEqual(EMBEDDINGS_LOADING);
  });
});
