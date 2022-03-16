import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import postErrorToSlack from 'utils/slack/postErrorToSlack';

import ErrorBoundary from 'components/ErrorBoundary';

const content = 'Some content';

// ErrorBoundary renders the `_error.jsx` component if an error occurs.
// This is a string contained in the `_error.jsx component to test if the component is rendered.
const errorText = /Sorry, something went wrong on our end/i;

jest.mock('utils/slack/postErrorToSlack');

delete window.location;
window.location = { reload: jest.fn() };

const ThrowError = ({ hasError }) => {
  if (hasError) throw new Error('test');
  return content;
};

const renderErrorBoundary = (store, hasError = true) => {
  render(
    <Provider store={store}>
      <ErrorBoundary>
        <ThrowError hasError={hasError} />
      </ErrorBoundary>
    </Provider>,
  );
};

let storeState = null;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.NODE_ENV = 'production';
    storeState = makeStore();
  });

  it('Does not render if there is no error', () => {
    renderErrorBoundary(storeState, false);

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByText(errorText)).toBeNull();
  });

  it('Renders the error page if there is an error', () => {
    renderErrorBoundary(storeState);

    expect(screen.queryByText(content)).toBeNull();
    expect(screen.getByText(errorText)).toBeInTheDocument();
  });

  it('Should post error if environment is production', async () => {
    renderErrorBoundary(storeState);

    expect(postErrorToSlack).toHaveBeenCalledTimes(1);
    const payload = postErrorToSlack.mock.calls[0];
    expect(payload).toMatchSnapshot();
  });

  it('Should not post error if environment is not production', async () => {
    process.env.NODE_ENV = 'staging';

    renderErrorBoundary(storeState);

    expect(postErrorToSlack).not.toHaveBeenCalled();
  });

  it('Clicking reload page reloads the page', () => {
    renderErrorBoundary(storeState);

    userEvent.click(screen.getByText(/Reload/i));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
