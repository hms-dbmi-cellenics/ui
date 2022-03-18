import React, { useState } from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import postErrorToSlack from 'utils/postErrorToSlack';

import ErrorBoundary from 'components/ErrorBoundary';
import loadEnvironment from 'redux/actions/networkResources/loadEnvironment';

const content = 'Some content';

// ErrorBoundary renders the `_error.jsx` component if an error occurs.
// This is a string contained in the `_error.jsx component to test if the component is rendered.
const errorText = /Sorry, something went wrong on our end/i;

jest.mock('utils/postErrorToSlack');

delete window.location;
window.location = { reload: jest.fn() };

const throwError = () => {
  screen.getByText('Throw').click();
};

const TestComponent = () => {
  const [hasError, setHasError] = useState(false);

  if (hasError) throw new Error('Error');

  return (
    <>
      <button type='button' onClick={() => setHasError(true)}>Throw</button>
      <div>{content}</div>
    </>
  );
};

const renderErrorBoundary = (store, hasError = true) => {
  render(
    <Provider store={store}>
      <ErrorBoundary>
        <TestComponent hasError={hasError} />
      </ErrorBoundary>
    </Provider>,
  );
};

let storeState = null;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeState = makeStore();
    storeState.dispatch(loadEnvironment('production'));
  });

  it('Does not render if there is no error', () => {
    renderErrorBoundary(storeState, false);

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByText(errorText)).toBeNull();
  });

  it('Still render the UI if there is an error', async () => {
    renderErrorBoundary(storeState);

    throwError();

    await waitFor(() => {
      expect(postErrorToSlack).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByText(errorText)).toBeNull();
  });

  it('Should post error if environment is production', async () => {
    renderErrorBoundary(storeState);

    throwError();

    await waitFor(() => {
      expect(postErrorToSlack).toHaveBeenCalledTimes(1);
      const payload = postErrorToSlack.mock.calls[0];
      expect(payload).toMatchSnapshot();
    });
  });

  it('Should not post error if environment is not production', async () => {
    storeState.dispatch(loadEnvironment('staging'));
    renderErrorBoundary(storeState);

    throwError();

    expect(postErrorToSlack).not.toHaveBeenCalled();
  });
});
