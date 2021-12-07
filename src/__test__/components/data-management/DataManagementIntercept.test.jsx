import React from 'react';
import { screen, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useRouter } from 'next/router';
import fake from '__test__/test-utils/constants';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import userEvent from '@testing-library/user-event';
import DataManagementIntercept from '../../../components/data-management/DataManagementIntercept';

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

const mockRouter = {
  pathname: '/data-processing',
  push: jest.fn(),
};
useRouter.mockReturnValue(mockRouter);

const mockStore = configureStore([thunk]);
jest.mock('');
const store = mockStore({});
describe('Data Management Intercept', () => {
  const onContinue = jest.fn();
  const onDismissIntercept = jest.fn();
  const renderDataManagementIntercept = () => {
    render(
      <Provider store={store}>
        <DataManagementIntercept
          rerunStatus={{ rerun: true }}
          onContinueNavigation={onContinue}
          onDismissIntercept={onDismissIntercept}
          experimentId={fake.EXPERIMENT_ID}
        />
      </Provider>,
    );
  };
  it('Renders correctly', () => {
    renderDataManagementIntercept();
    const continueButton = screen.getByText('Continue');
    expect(continueButton).toBeInTheDocument();
    expect(screen.getByText('Re-process')).toBeInTheDocument();
    userEvent.click(continueButton);
    expect(onContinue).toBeCalledTimes(1);
    expect(onDismissIntercept).toBeCalledTimes(1);
  });
  it('starts gem2s on request', () => {
    renderDataManagementIntercept();
    const reProcessButton = screen.getByText('Re-process');
    userEvent.click(reProcessButton);
    expect(store.getActions()).toEqual([
      { payload: { experimentId: fake.EXPERIMENT_ID }, type: 'backendStatus/backendStatusLoading' },
    ]);
  });
});
