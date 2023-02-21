import '@testing-library/jest-dom';
import '__test__/test-utils/setupTests';

import {
  render,
  screen,
} from '@testing-library/react';

import { Provider } from 'react-redux';
import React from 'react';
import RepositoryTable from 'components/repository/RepositoryTable';
import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';
import fetchAPI from 'utils/http/fetchAPI';
import initialState from 'redux/reducers/experiments/initialState';
import thunk from 'redux-thunk';
import userEvent from '@testing-library/user-event';

jest.mock('utils/http/fetchAPI');
const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));
const mockStore = configureMockStore([thunk]);

const experiment1 = {
  id: '1',
  name: 'Experiment 1',
  species: 'Human',
  sampleCount: '4',
  cellCount: '23000',
  technology: '10x',
  description: 'A sample experiment for users to try',
};

const emptyStore = mockStore({
  experiments: {
    ...initialState,
    ids: [],
    meta: {
      activeExperimentId: null,
    },
  },
});
const renderRepository = async (storeState, data) => {
  await act(async () => {
    render(
      <Provider store={storeState}>
        <RepositoryTable data={data} />
      </Provider>,
    );
  });
};

describe('RepositoryTable', () => {
  it('renders correctly without any experiments', async () => {
    await renderRepository(emptyStore);

    // Expect there to be no experiments
    expect(screen.findByText('There are no experiments in the repository yet.')).toBeDefined();
  });

  it('renders correctly the experiment', async () => {
    await renderRepository(emptyStore, [experiment1]);

    // Expect there to be no experiments
    Object.values(experiment1).forEach((prop) => {
      if (prop === '10x') {
        expect(screen.findByText('10x Chromium')).toBeDefined();
      } else {
        expect(screen.findByText(prop)).toBeDefined();
      }
    });
  });

  it('Cloning from example experiments works correctly', async () => {
    await renderRepository(emptyStore, [experiment1]);

    await act(async () => {
      userEvent.click(screen.getByRole('button', {
        name: /clone/i,
      }));
    });

    expect(fetchAPI.mock.calls).toMatchSnapshot();
  });
});
