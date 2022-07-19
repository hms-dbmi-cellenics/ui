import React from 'react';
import Error from 'pages/_error';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';

import postErrorToSlack from 'utils/postErrorToSlack';
import loadDeploymentInfo from 'redux/actions/networkResources/loadDeploymentInfo';
import { DomainName } from 'utils/deploymentInfo';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

jest.mock('utils/postErrorToSlack');

const mockErrorProp = {
  errorObject: { message: 'Some error message' },
};

const defaultProps = {};
const renderErrorFactory = createTestComponentFactory(Error, defaultProps);

const renderErrorPage = (newProps, store = storeState) => {
  render(
    <Provider store={store}>
      {renderErrorFactory(newProps)}
    </Provider>,
  );
};

delete window.location;
window.location = { reload: jest.fn() };

let storeState = null;

describe('ErrorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeState = makeStore();
    storeState.dispatch(loadDeploymentInfo({ environment: 'production', domainName: DomainName.BIOMAGE }));
  });

  it('Renders properly without props', () => {
    renderErrorPage({}, storeState);

    expect(screen.getByText(/Sorry, something went wrong on our end./i)).toBeInTheDocument();

    // There should be a feedback button and a reload button
    expect(screen.getByText(/Feedback or issues?/i).closest('button')).toBeInTheDocument();
    expect(screen.getByText(/Reload page/i)).toBeInTheDocument();
  });

  it('Shows the HTTP status code and error text', () => {
    renderErrorPage({
      statusCode: 404,
      errorText: 'Not Found',
    }, storeState);

    expect(screen.getByText(/404/)).toBeInTheDocument();

    expect(screen.getByText(/The error is reported as/i)).toBeInTheDocument();
    expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
  });

  it('Clicking the reload button should reload the page', () => {
    renderErrorPage();

    userEvent.click(screen.getByText(/Reload page/i));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('Should post error to Slack if environment is production', () => {
    storeState.dispatch(loadDeploymentInfo({ environment: 'production', domainName: DomainName.BIOMAGE }));

    renderErrorPage(mockErrorProp, storeState);

    expect(postErrorToSlack).toHaveBeenCalledTimes(1);
    expect(postErrorToSlack.mock.calls[0]).toMatchSnapshot();
  });

  it('Should post error to Slack if environment is staging', () => {
    storeState.dispatch(loadDeploymentInfo({ environment: 'staging', domainName: DomainName.BIOMAGE }));

    renderErrorPage(mockErrorProp, storeState);

    expect(postErrorToSlack).toHaveBeenCalledTimes(1);
    expect(postErrorToSlack.mock.calls[0]).toMatchSnapshot();
  });

  it('Should not post error to Slack if environment is not production', () => {
    storeState.dispatch(loadDeploymentInfo({ environment: 'development', domainName: DomainName.BIOMAGE }));

    renderErrorPage(mockErrorProp, storeState);

    expect(postErrorToSlack).not.toHaveBeenCalled();
  });
});
