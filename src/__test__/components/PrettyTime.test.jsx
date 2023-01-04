import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrettyTime from 'components/PrettyTime';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTimePlugin);

const isoTime = '2021-01-01T01:01:01.000Z';
const relativeTime = dayjs(isoTime).fromNow();
const localIsoTime = 'Friday, January 1, 2021 1:01 AM';

describe('PrettyTime', () => {
  it('displays the relative time by default', () => {
    render(<PrettyTime isoTime={isoTime} />);
    expect(screen.getByText(relativeTime)).toBeInTheDocument();
  });

  it('displays invalid date if date is invalid', () => {
    render(<PrettyTime isoTime={null} />);
    expect(screen.queryByText(relativeTime)).toBeNull();
    expect(screen.getByText('invalid date')).toBeInTheDocument();
  });

  it('displays the full time on hover', () => {
    render(<PrettyTime isoTime={isoTime} />);
    const element = screen.getByText(relativeTime);
    userEvent.hover(element);
    expect(screen.getByText(`on ${localIsoTime}`)).toBeInTheDocument();
  });

  it('displays the relative time again on mouse leave', () => {
    render(<PrettyTime isoTime={isoTime} />);
    const element = screen.getByText(relativeTime);
    userEvent.hover(element);
    userEvent.unhover(element);
    expect(screen.getByText(relativeTime)).toBeInTheDocument();
  });
});
