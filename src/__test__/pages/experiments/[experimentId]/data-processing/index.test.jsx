import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import waitForActions from 'redux-mock-store-await-actions';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import _ from 'lodash';
import { Modal } from 'antd';
import DataProcessingPage from '../../../../../pages/experiments/[experimentId]/data-processing/index';

import generateExperimentSettingsMock from '../../../../test-utils/experimentSettings.mock';
import { initialPlotConfigStates } from '../../../../../redux/reducers/componentConfig/initialState';
import initialCellSetsState from '../../../../../redux/reducers/cellSets/initialState';

import { BACKEND_STATUS_LOADING } from '../../../../../redux/actionTypes/backendStatus';

configure({ adapter: new Adapter() });

jest.mock('localforage');

jest.mock('../../../../../utils/RouteContext', () => ({
  useAppRouter: jest.fn().mockReturnValue(() => {}),
}));

const mockStore = configureMockStore([thunk]);

const sampleIds = ['sample-1', 'sample-2'];

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const getStore = (experimentId, settings = {}) => {
  const initialState = {
    backendStatus: {
      [experimentId]: {
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
    notifications: {},
    experimentSettings: {
      ...initialExperimentState,
      info: {
        ...initialExperimentState.info,
        sampleIds,
      },
      processing: {
        ...initialExperimentState.processing,
        meta: {
          loading: false,
          stepsDone: new Set([]),
          loadingSettingsError: false,
          completingStepError: false,
          changedQCFilters: new Set(),
        },
      },
    },
    experiments: { [experimentId]: {} },
    componentConfig: { ...initialPlotConfigStates },
    cellSets: { ...initialCellSetsState },
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
    const experimentId = 'experimentId';
    const store = getStore(experimentId);

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId={experimentId} experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    const header = page.find('Header');
    expect(header.length).toEqual(1);

    const card = page.find('Card');
    expect(card.length).toEqual(1);

    const runFilterButton = page.find('#runFilterButton').filter('Button');

    // Run filter doesn't exist initially
    expect(runFilterButton.length).toEqual(0);
  });

  it('triggers the pipeline on click run filter', async () => {
    const experimentId = 'experimentId';
    const store = getStore(experimentId, { experimentSettings: { processing: { meta: { changedQCFilters: new Set(['classifier']) } } } });

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId={experimentId} experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    const filterComponent = page.find('#classifier');

    act(() => {
      filterComponent.at(0).props().onConfigChange();
    });

    page.update();

    const runFilterButton = page.find('#runFilterButton').filter('Button');

    // Run filter shows up after changes take place
    expect(runFilterButton.length).toEqual(1);

    act(() => { runFilterButton.at(0).props().onClick(); });
    page.update();
    const modal = page.find(Modal);
    const startButton = modal.find('Button').at(1);
    act(() => startButton.simulate('click'));

    // Pipeline is triggered on clicking run button
    await waitForActions(
      store,
      [BACKEND_STATUS_LOADING],
      { matcher: waitForActions.matchers.containing },
    );
  });

  it('preFiltered on a sample disables filter', async () => {
    const experimentId = 'experimentId';

    const store = getStore(
      experimentId,
      {
        samples: {
          'sample-1': {
            preFiltered: true,
          },
        },
      },
    );

    const page = mount(
      <Provider store={store}>
        <DataProcessingPage experimentId={experimentId} experimentData={experimentData} route='route'>
          <></>
        </DataProcessingPage>
      </Provider>,
    );

    // Run filter button doesn't show up on the first
    expect(page.find('#runFilterButton').filter('Button').length).toEqual(0);
  });
});
