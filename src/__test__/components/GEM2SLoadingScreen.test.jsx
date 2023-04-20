import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { makeStore } from 'redux/store';
import fetchAPI from 'utils/http/fetchAPI';
import GEM2SLoadingScreen from 'components/GEM2SLoadingScreen';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import userEvent from '@testing-library/user-event';

const store = makeStore();

const defaultProps = {
  gem2sStatus: 'toBeRun',
  completedSteps: [],
  experimentId: null,
  experimentName: null,
};

const GEM2SLoadingScreenFactory = createTestComponentFactory(GEM2SLoadingScreen, defaultProps);

const renderGEM2SLoadingScreen = (props = {}) => render(
  <Provider store={store}>
    {GEM2SLoadingScreenFactory(props)}
  </Provider>,
);

jest.mock('utils/http/fetchAPI');
fetchAPI.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}))));

describe('GEM2SLoadingScreen', () => {
  it('Does not render without gem2s status', () => {
    expect(() => render(<GEM2SLoadingScreen />)).toThrow();
  });

  it('Renders toBeRun state correctly', () => {
    renderGEM2SLoadingScreen();

    expect(screen.getByText('Let\'s upload and pre-process data your data.')).toBeInTheDocument();
    expect(screen.getByText('Go to Data Management')).toBeInTheDocument();
  });

  it('Renders error state correctly', () => {
    renderGEM2SLoadingScreen({ gem2sStatus: 'error' });

    expect(screen.getByText('We\'ve had an issue while launching your analysis.')).toBeInTheDocument();
    expect(screen.getByText('You can launch another analysis or retry to launch the current analysis.')).toBeInTheDocument();

    expect(screen.getByText('Launch Another Analysis')).toBeInTheDocument();
    expect(screen.getByText('Re-launch Current Analysis')).toBeInTheDocument();
    expect(screen.queryByText('Go to Data Management')).toBeNull();
  });

  it('Clicking re-launch analysis re-runs GEM2S', () => {
    renderGEM2SLoadingScreen({ gem2sStatus: 'error' });

    userEvent.click(screen.getByText('Re-launch Current Analysis'));
    expect(fetchAPI).toHaveBeenCalled();
  });

  it('Renders running state correctly', () => {
    const completedSteps = [
      'step 1',
      'step 2',
    ];

    renderGEM2SLoadingScreen({ gem2sStatus: 'running', completedSteps });
    expect(screen.getByText('Computing metrics')).toBeInTheDocument();
    expect(screen.queryByText('Go to Data Management')).toBeNull();
  });

  it('Shows correct screen for subsetting experiment ', async () => {
    const experimentName = 'newExperiment';

    renderGEM2SLoadingScreen({ gem2sStatus: 'subsetting', experimentName });

    const experimentNameRegex = new RegExp(experimentName);

    expect(screen.getByText(/Subsetting cell sets into/)).toBeInTheDocument();
    expect(screen.getByText(experimentNameRegex)).toBeInTheDocument();
    expect(screen.getByText('Your new project containing only the selected cell sets will be available in the Data Management module'));
  });
});
