import React from 'react';
import {
  render, screen,
} from '@testing-library/react';
import NotifyByEmail from 'components/NotifyByEmail';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import * as updateExperiment from 'redux/actions/experiments/updateExperiment';
import initialExperimentsState from 'redux/reducers/experiments/initialState';
import * as loadProjects from 'redux/actions/projects/loadProjects';
import * as loadExperiments from 'redux/actions/experiments/loadExperiments';

const mockStore = configureMockStore([thunk]);
const experimentId = 'someExperiment';
const activeProjectUuid = 'project1';
const defaultState = {
  projects: {
    meta: {
      activeProjectUuid,
    },
  },
  experiments: {
    [experimentId]: {
      notifyByEmail: false,
    },
    ids: [experimentId],
  },
};

describe('Notify by email component', () => {
  let updateExperimentSpy;
  let loadProjectsSpy;
  let loadExperimentsSpy;
  let store;
  beforeEach(() => {
    jest.clearAllMocks();
    updateExperimentSpy = jest.spyOn(updateExperiment, 'default');
    loadProjectsSpy = jest.spyOn(loadProjects, 'default');
    loadExperimentsSpy = jest.spyOn(loadExperiments, 'default');
  });
  const renderNotifyByEmail = (state) => {
    store = mockStore(state);
    render(
      <Provider store={store}>
        <NotifyByEmail
          experimentId={experimentId}
        />
      </Provider>,
    );
  };

  it('Renders Correctly', () => {
    renderNotifyByEmail(defaultState);
    expect(screen.getByText('Get notified about your pipeline status via email')).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('Saves experiment config on toggle on/off', () => {
    renderNotifyByEmail(defaultState);
    const toggle = screen.getByRole('switch');
    userEvent.click(toggle);
    expect(updateExperimentSpy).toHaveBeenLastCalledWith(experimentId, { notifyByEmail: true });
    userEvent.click(toggle);
    expect(updateExperimentSpy).toHaveBeenCalledTimes(2);
  });

  it('loads projects if non-existent', () => {
    const state = {
      experiments: {
        ...initialExperimentsState,
      },
      projects: {
        meta: {
          activeProjectUuid: null,
        },
      },
    };
    renderNotifyByEmail(state);
    expect(loadProjectsSpy).toHaveBeenCalledTimes(1);
  });
  it('loads experiments if  there is an activeProjectUuid', () => {
    const state = {
      experiments: {
        ...initialExperimentsState,
      },
      projects: {
        meta: {
          activeProjectUuid,
        },
      },
    };
    renderNotifyByEmail(state);
    expect(loadExperimentsSpy).toHaveBeenCalledTimes(1);
  });
});
