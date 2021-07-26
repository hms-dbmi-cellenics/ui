import React from 'react';
import _ from 'lodash';
import {
  Form, Select,
} from 'antd';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CalculationConfig from '../../../../components/data-processing/DataIntegration/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';
import generateDataProcessingPlotUuid from '../../../../utils/generateDataProcessingPlotUuid';
import {
  EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
} from '../../../../redux/actionTypes/experimentSettings';

jest.mock('localforage');
enableFetchMocks();
const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

describe('Data Integration Calculation Config', () => {
  const filterName = 'dataIntegration';

  const onConfigChange = jest.fn(() => {});

  const PCObject = () => ({ PC: 1, percent: 0.02, percentVariance: 0.02 });
  const storeState = {
    experimentSettings: {
      ...initialExperimentState,
    },
    componentConfig: {
      [generateDataProcessingPlotUuid(null, filterName, 1)]: {
        config: {},
        plotData: Array(50).fill(PCObject()),
      },
    },
  };

  configure({ adapter: new Adapter() });

  beforeEach(async () => {
    await preloadAll();

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  const experimentId = '1234';
  const config = storeState.experimentSettings.processing.dataIntegration;

  it('renders correctly when nothing is loaded', () => {
    const store = mockStore({
      embeddings: {},
      experimentSettings: {
        ...initialExperimentState,
      },
      componentConfig: {
        [generateDataProcessingPlotUuid(null, filterName, 1)]: {
          config: {},
          plotData: [],
        },
      },
    });

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId={experimentId}
          changedFilters={{ current: new Set() }}
          config={config}
          onConfigChange={onConfigChange}
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
          experimentId={experimentId}
          changedFilters={{ current: new Set() }}
          config={config}
          onConfigChange={onConfigChange}
        />
      </Provider>,
    );

    // There should no spinner anymore.
    const spin = component.find('Loader');
    expect(spin.length).toEqual(0);

    // There should be a form loaded.
    const form = component.find(Form);
    expect(form.length).toBeGreaterThan(0);
  });

  it('fires action to update config when a setting is changed', async () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId={experimentId}
          changedFilters={{ current: new Set() }}
          config={config}
          onConfigChange={onConfigChange}
        />
      </Provider>,
    );

    act(() => { component.find(Select).at(0).getElement().props.onChange('seuratv3'); });

    component.update();

    expect(onConfigChange).toHaveBeenCalledTimes(1);
  });

  it('displays the correct proportion of variation explained value', async () => {
    const store = mockStore(storeState);

    const component = mount(
      <Provider store={store}>
        <CalculationConfig
          experimentId={experimentId}
          changedFilters={{ current: new Set() }}
          config={config}
          onConfigChange={onConfigChange}
        />
      </Provider>,
    );

    const variationExplainedComponent = component.find('InputNumber');

    expect(variationExplainedComponent.at(2).props().value).toEqual(60);
  });
});
