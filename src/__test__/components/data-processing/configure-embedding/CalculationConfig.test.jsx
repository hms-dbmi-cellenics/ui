import React from 'react';
import _ from 'lodash';
import {
  Select, Form, Alert,
} from 'antd';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import CalculationConfig from 'components/data-processing/ConfigureEmbedding/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

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

  const mockOnConfigChange = jest.fn(() => { });
  const mockOnPipelineRun = jest.fn(() => { });

  beforeEach(async () => {
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

  afterEach(() => {
    jest.clearAllMocks();
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
          experimentId='1234'
          width={50}
          height={50}
          onPipelineRun={mockOnPipelineRun}
          onConfigChange={mockOnConfigChange}
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
          onPipelineRun={mockOnPipelineRun}
          onConfigChange={mockOnConfigChange}
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

  it('A changed setting should show an alert', () => {
    const changedStepStoreState = _.cloneDeep(storeState);
    changedStepStoreState.experimentSettings.processing.meta.changedQCFilters = new Set(['configureEmbedding']);
    const store = mockStore(changedStepStoreState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
          onPipelineRun={mockOnPipelineRun}
          onConfigChange={mockOnConfigChange}
        />
      </Provider>,
    );

    // The alert should show up.
    const alert = component.find(Alert);
    expect(alert.length).toEqual(1);
  });

  it('a changed setting should trigger an onConfigChange callback', () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId='1234'
          width={50}
          height={50}
          onConfigChange={mockOnConfigChange}
        />
      </Provider>,
    );

    // Switching the embedding type...
    act(() => { component.find(Select).at(0).getElement().props.onChange('tsne'); });

    component.update();

    expect(mockOnConfigChange).toHaveBeenCalledTimes(1);
  });
});
