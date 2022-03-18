import Error from 'pages/_error';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const defaultProps = {};
const renderErrorFactory = createTestComponentFactory(Error, defaultProps);

const renderErrorPage = (newProps) => {
  render(renderErrorFactory(newProps));
};

delete window.location;
window.location = { reload: jest.fn() };

describe('ErrorPage', () => {
  it('Renders properly without props', () => {
    renderErrorPage();

    expect(screen.getByText(/Sorry, something went wrong on our end./i)).toBeInTheDocument();

    // There should be a feedback buttona and a reload button
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
});
