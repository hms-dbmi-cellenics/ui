import React from 'react';

import dayjs from 'dayjs';

import {
  render, screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { act } from 'react-dom/test-utils';

import PlatformError from 'components/PlatformError';

import WorkResponseError from 'utils/errors/http/WorkResponseError';
import WorkGenericError from 'utils/errors/http/WorkGenericError';
import WorkTimeoutError from 'utils/errors/http/WorkTimeoutError';

import '__test__/test-utils/setupTests';

const mockWindowLocation = () => {
  delete window.location;
  window.location = { reload: jest.fn() };
};

describe('PlatformError', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('Shows default message with no props', async () => {
    mockWindowLocation();

    act(() => {
      render(<PlatformError />);
    });

    // Shows default reason
    expect(screen.getByText(/That's all we know/)).toBeDefined();

    // Shows default description
    expect(screen.getByText(/We're sorry, we couldn't load this./)).toBeDefined();

    // Shows correct image
    const image = screen.getByAltText(/A woman with a paintbrush staring at an empty canvas \(illustration\)./);
    expect(image).toHaveAttribute('src', '/undraw_blank_canvas_3rbb.svg');

    // Button exists
    const button = screen.getByText(/Try again/).closest('button');

    // Actionable by default
    expect(button).not.toBeDisabled();

    // Reloads window on click
    userEvent.click(button);
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('Renders correctly on WorkResponseError', async () => {
    const errorMessage = 'some message';
    const error = new WorkResponseError(errorMessage);

    act(() => {
      render(<PlatformError error={error} />);
    });

    // Shows correct reason
    expect(screen.getByText(/We had an error on our side while we were completing your request./)).toBeDefined();

    // Doesn't show custom reason
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();

    // Has all the other default behaviour
    expect(screen.getByText(/We're sorry, we couldn't load this./)).toBeDefined();

    const image = screen.getByAltText(/A woman with a paintbrush staring at an empty canvas \(illustration\)./);
    expect(image).toHaveAttribute('src', '/undraw_blank_canvas_3rbb.svg');

    const button = screen.getByText(/Try again/).closest('button');
    expect(button).not.toBeDisabled();
  });

  it('Renders correctly on WorkGenericError', async () => {
    const errorMessage = 'some generic error message';
    const error = new WorkGenericError(errorMessage);

    act(() => {
      render(<PlatformError error={error} />);
    });

    // Shows custom reason
    expect(screen.getByText(errorMessage)).toBeDefined();

    // Has all the other default behaviour
    expect(screen.getByText(/We're sorry, we couldn't load this./)).toBeDefined();

    const image = screen.getByAltText(/A woman with a paintbrush staring at an empty canvas \(illustration\)./);
    expect(image).toHaveAttribute('src', '/undraw_blank_canvas_3rbb.svg');

    const button = screen.getByText(/Try again/).closest('button');
    expect(button).not.toBeDisabled();
  });

  it('Renders correctly on WorkTimeoutError', async () => {
    const getTimeoutMessage = (relativeTime) => (
      screen.getByText((content, node) => {
        const hasText = (n) => (
          n.textContent === `We were expecting your request to arrive ${relativeTime}, but we were too slow.We stopped waiting so you can try again.`
        );
        const nodeHasText = hasText(node);

        const childrenDontHaveText = Array.from(node.children).every(
          (child) => !hasText(child),
        );

        return nodeHasText && childrenDontHaveText;
      })
    );

    const timeoutDate = dayjs().add(120, 's').toISOString();
    const error = new WorkTimeoutError(120, timeoutDate, {}, 'someETag');

    act(() => {
      render(<PlatformError error={error} />);
    });

    expect(getTimeoutMessage('just now')).toBeDefined();

    // If time passes
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Time message changed
    expect(getTimeoutMessage('in 2 minutes')).toBeDefined();
  });

  it('Renders correctly based on other custom props if passed', async () => {
    const description = 'description';
    const customOnClick = jest.fn();

    act(() => {
      render(<PlatformError description={description} onClick={customOnClick} />);
    });

    // Shows default reason
    expect(screen.getByText(/That's all we know/)).toBeDefined();

    // Shows custom description
    expect(screen.getByText(description)).toBeDefined();

    // Button exists
    const button = screen.getByText(/Try again/).closest('button');

    // Actionable by default
    expect(button).not.toBeDisabled();

    // Does custom action on click
    userEvent.click(button);
    expect(customOnClick).toHaveBeenCalledTimes(1);
  });

  it('Hides try again button if not actionable', async () => {
    act(() => {
      render(<PlatformError actionable={false} />);
    });

    // Button doesn't exist
    expect(screen.queryByText(/Try again/)).not.toBeInTheDocument();
  });
});
