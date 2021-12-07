import React from 'react';
import { screen, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import userEvent from '@testing-library/user-event';
import DataManagementIntercept from '../../../components/data-management/DataManagementIntercept';

const mockStore = configureStore([thunk]);

describe('Data Management Intercept', () => {
  const onContinue = jest.fn();
  const onDismissIntercept = jest.fn();
  const renderDataManagementIntercept = () => {
    render(
      <Provider store={mockStore({})}>
        <DataManagementIntercept
          onContinueNavigation={onContinue}
          onDismissIntercept={onDismissIntercept}
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
});
