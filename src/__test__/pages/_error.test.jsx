import React from 'react';
import Error from 'pages/_error';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import postErrorToSlack from 'utils/postErrorToSlack';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import initialState from 'redux/reducers/cellSets/initialState';

jest.mock('utils/postErrorToSlack');

const mockStore = configureMockStore([thunk]);

const mockErrorProp = {
  errorObject: { message: 'Some error message' },
};

const storeState = {
  // Added cellSets initial state to test for dumping of state
  cellSets: initialState,
  networkResources: { environment: 'test' },
};

const defaultProps = {};
const renderErrorFactory = createTestComponentFactory(Error, defaultProps);

const renderErrorPage = (newProps, store = storeState) => {
  render(
    <Provider store={mockStore(store)}>
      {renderErrorFactory(newProps)}
    </Provider>,
  );
};

delete window.location;
window.location = { reload: jest.fn() };

describe('ErrorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders properly without props', () => {
    renderErrorPage();

    expect(screen.getByText(/Sorry, something went wrong on our end./i)).toBeInTheDocument();

    // There should be a feedback button and a reload button
    expect(screen.getByText(/Feedback or issues?/i).closest('button')).toBeInTheDocument();
    expect(screen.getByText(/Reload page/i)).toBeInTheDocument();
  });

  it('Shows the HTTP status code and error text', () => {
    renderErrorPage({
      statusCode: 404,
      errorText: 'Not Found',
    });

    expect(screen.getByText(/404/)).toBeInTheDocument();

    expect(screen.getByText(/The error is reported as/i)).toBeInTheDocument();
    expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
  });

  it('Clicking the reload button should reload the page', () => {
    renderErrorPage();

    userEvent.click(screen.getByText(/Reload page/i));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it.only('Should post error to Slack if environment is production', () => {
    const productionState = {
      ...storeState,
      networkResources: { environment: 'staging' },
    };

    renderErrorPage(mockErrorProp, productionState);

    expect(postErrorToSlack).toHaveBeenCalledTimes(1);
    expect(postErrorToSlack.mock.calls[0]).toMatchSnapshot();
  });

  it('Should not post error to Slack if environment is not production', () => {
    const stagingState = {
      ...storeState,
      networkResources: { environment: 'production' },
    };

    renderErrorPage(mockErrorProp, stagingState);

    expect(postErrorToSlack).not.toHaveBeenCalled();
  });
});
