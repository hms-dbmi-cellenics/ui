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
import generateExperimentSettingsMock from '../../../../test-utils/experimentSettings.mock';
import { initialPlotConfigStates } from '../../../../../redux/reducers/componentConfig/initialState';

import { EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING } from '../../../../../redux/actionTypes/experimentSettings';

configure({ adapter: new Adapter() });

jest.mock('localforage');

const mockStore = configureMockStore([thunk]);

const sampleIds = ['sample-1', 'sample-2'];

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const getStore = (settings = {}) => {
  const initialState = {
    notifications: {},
    experimentSettings: {
      ...initialExperimentState,
      processing: {
        ...initialExperimentState.processing,
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
            status: 'SUCCEEDED',
            completedSteps: [
              'CellSizeDistributionFilter',
              'MitochondrialContentFilter',
              'ClassifierFilter',
              'NumGenesVsNumUmisFilter',
              'DoubletScoresFilter',
            ],
          },
        },
      },
    },
    experiments: { experimentId: {} },
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
      ids: sampleIds,
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

  it('renders correctly', () => {
    const store = getStore();

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

    const runFilterButton = page.find('#runFilterButton').filter('Button');
    expect(runFilterButton.length).toEqual(1);

    // Run filter is disabled initially
    expect(runFilterButton.at(0).props().disabled).toEqual(true);
  });

  it('triggers the pipeline on click run filter', async () => {
    const store = getStore();

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
    // Run filter is enabled after changes take place
    expect(page.find('#runFilterButton').filter('Button').at(0).props().disabled).toEqual(false);

    act(() => {
      page
        .find('#runFilterButton').filter('Button')
        .at(0).props()
        .onClick();
    });

    page.update();

    // Pipeline is triggered on clicking run button
    await waitForActions(store, [EXPERIMENT_SETTINGS_BACKEND_STATUS_LOADING]);

    // Run filter is disabled after triggering the pipeline
    expect(page.find('#runFilterButton').filter('Button').at(0).props().disabled).toEqual(true);
  });

  it('preFiltered on a sample disables filter', async () => {
    const store = getStore({
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

    // Run filter button is disabled on the first
    expect(page.find('#runFilterButton').filter('Button').at(0).props().disabled).toEqual(true);
  });
});
