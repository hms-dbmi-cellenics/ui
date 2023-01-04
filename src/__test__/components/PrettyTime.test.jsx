import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrettyTime from 'components/PrettyTime';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import localizedFormatPlugin from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormatPlugin);

const isoTime = '2021-01-01T01:01:01.000Z';
const relativeTime = dayjs(isoTime).fromNow();
const localIsoTime = dayjs(isoTime).format('LLLL');

describe('PrettyTime', () => {
  it('displays the relative time by default', () => {
    const { getByText } = render(<PrettyTime isoTime={isoTime} />);
    expect(getByText(relativeTime)).toBeInTheDocument();
  });

  it('displays the full time on hover', () => {
    const { getByText } = render(<PrettyTime isoTime={isoTime} />);
    const element = getByText(relativeTime);
    userEvent.hover(element);
    expect(getByText(`on ${localIsoTime}`)).toBeInTheDocument();
  });

  it('displays the relative time again on mouse leave', () => {
    const { getByText } = render(<PrettyTime isoTime={isoTime} />);
    const element = getByText(relativeTime);
    userEvent.hover(element);
    userEvent.unhover(element);
    expect(getByText(relativeTime)).toBeInTheDocument();
  });
});
