import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import waitForActions from 'redux-mock-store-await-actions';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import _ from 'lodash';

import DataProcessingPage from '../../../../../pages/experiments/[experimentId]/data-processing/index';

import initialCellSetsState from '../../../../../redux/reducers/cellSets/initialState';
import initialExperimentSettingsState from '../../../../test-utils/experimentSettings.mock';
import { initialPlotConfigStates } from '../../../../../redux/reducers/componentConfig/initialState';

import { EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING } from '../../../../../redux/actionTypes/experimentSettings';

configure({ adapter: new Adapter() });

jest.mock('localforage');

const mockStore = configureMockStore([thunk]);

const pipelineSucceeded = {
  pipeline: {
    status: 'SUCCEEDED',
    completedSteps: [
      'CellSizeDistributionFilter',
      'MitochondrialContentFilter',
      'ClassifierFilter',
      'NumGenesVsNumUmisFilter',
      'DoubletScoresFilter',
    ],
  },
};

const getStore = (settings = {}) => {
  const initialState = {
    notifications: {},
    experimentSettings: {
      ...initialExperimentSettingsState,
      processing: {
        ...initialExperimentSettingsState.processing,
        meta: {
          loading: false,
          stepsDone: new Set([]),
          loadingSettingsError: false,
          completingStepError: false,
        },
      },
      backendStatus: {
        loading: false,
        error: false,
        status: {
          pipeline: {
            status: 'NotCreated',
            completedSteps: [],
          },
        },
      },
    },
    cellSets: {
      ...initialCellSetsState,
      properties: {
        test: {
          name: 'Test',
          cellIds: new Set(),
        },
        'test-1': {
          name: 'Test-1',
          cellIds: new Set([1, 2, 3]),
        },
        'test-2': {
          name: 'Test-1',
          cellIds: new Set([4, 5, 6]),
        },
        sample: {
          name: 'Test',
          cellIds: new Set(),
        },
        'sample-1': {
          name: 'Test-1',
          cellIds: new Set([2, 3]),
        },
        'sample-2': {
          name: 'Test-1',
          cellIds: new Set([1, 4, 5, 6]),
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
        {
          key: 'sample',
          children: [
            { key: 'sample-1' },
            { key: 'sample-2' },
          ],
        },
      ],
      loading: false,
      error: false,
    },
    componentConfig: {
      ...initialPlotConfigStates,
    },
    samples: {
      ids: ['sample-1', 'sample-2'],
      meta: {
        loading: false,
        error: false,
      },
      'sample-1': {
        name: 'sample-1',
      },
      'sample-2': {
        name: 'sample-2',
      },
    },
  };

  const store = mockStore(_.merge(initialState, settings));

  return store;
};

describe('DataProcessingPage', () => {
  const experimentData = {};

  it('renders correctly after a successful pipeline run', () => {
    const store = getStore({
      experimentSettings: {
        backendStatus: {
          status: pipelineSucceeded,
        },
      },
    });

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId='experimentId' experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    const header = page.find('Header');
    expect(header.length).toEqual(1);

    const card = page.find('Card');
    expect(card.length).toEqual(1);

    const runDataProcessingButton = page.find('#runQCPipelineButton').filter('Button');
    expect(runDataProcessingButton.length).toEqual(1);

    // Run filter is disabled after pipeline is run successfully
    expect(runDataProcessingButton.at(0).props().disabled).toEqual(true);
  });

  it('shows run data processing button if there is no pipeline run yet', async () => {
    const store = getStore();

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId='experimentId' experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    const runDataProcessingButton = page.find('#runQCPipelineButton').filter('Button').at(0);

    expect(runDataProcessingButton.props().disabled).toEqual(false);
    expect(runDataProcessingButton.text()).toEqual('Run Data Processing');
  });

  it('triggers the pipeline on click run filter', async () => {
    const store = getStore({
      experimentSettings: {
        backendStatus: {
          status: pipelineSucceeded,
        },
      },
    });

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId='experimentId' experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    const filterComponent = page.find('#classifier');

    act(() => {
      filterComponent.at(0).props().onConfigChange();
    });

    page.update();

    const runDataProcessingButton = page.find('#runQCPipelineButton').filter('Button').at(0);

    // Run filter is enabled after changes take place
    expect(runDataProcessingButton.props().disabled).toEqual(false);
    expect(runDataProcessingButton.text()).toEqual('Save Changes');

    act(() => {
      page
        .find('#runQCPipelineButton').filter('Button')
        .at(0).props()
        .onClick();
    });

    page.update();

    // Pipeline is triggered on clicking run button
    await waitForActions(store, [EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING]);

    // Run filter is disabled after triggering the pipeline
    expect(page.find('#runQCPipelineButton').filter('Button').at(0).props().disabled).toEqual(true);
  });

  it('preFiltered on a sample disables filter', async () => {
    const store = getStore({
      experimentSettings: {
        backendStatus: {
          status: pipelineSucceeded,
        },
      },
      samples: {
        'sample-1': {
          preFiltered: true,
        },
      },
    });

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId='experimentId' experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    expect(page.find('#runQCPipelineButton').filter('Button').at(0).props().disabled).toEqual(true);
  });
});
