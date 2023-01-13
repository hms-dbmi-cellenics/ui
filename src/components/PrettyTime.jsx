import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import localizedFormatPlugin from 'dayjs/plugin/localizedFormat';
import PropTypes from 'prop-types';

dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormatPlugin);
dayjs.locale('en-US');

const PrettyTime = (props) => {
  const { isoTime } = props;

  const relativeTime = dayjs(isoTime).fromNow();
  const localIsoTime = dayjs(isoTime).format('LLLL');

  const [displayedTime, setDisplayedTime] = useState(relativeTime);

  return (
    <span
      style={{ textDecoration: 'underline dotted' }}
      onMouseEnter={() => setDisplayedTime(`on ${localIsoTime}`)}
      onMouseLeave={() => setDisplayedTime(relativeTime)}
    >
      {!isoTime ? 'invalid date' : displayedTime}
    </span>
  );
};

PrettyTime.propTypes = {
  isoTime: PropTypes.string,
};

PrettyTime.defaultProps = {
  isoTime: null,
};

export default PrettyTime;
