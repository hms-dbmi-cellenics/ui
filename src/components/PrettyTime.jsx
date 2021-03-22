import React, { useState } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';

const PrettyTime = (props) => {
  const { isoTime } = props;

  const relativeTime = moment(isoTime).fromNow();
  const localIsoTime = moment(isoTime).format('LLLL');

  const [displayedTime, setDisplayedTime] = useState(relativeTime);

  return (

    <span
      style={{ textDecoration: 'underline dotted' }}
      onMouseEnter={() => setDisplayedTime(`on ${localIsoTime}`)}
      onMouseLeave={() => setDisplayedTime(relativeTime)}
    >
      {displayedTime}
    </span>

  );
};

PrettyTime.propTypes = {
  isoTime: PropTypes.string.isRequired,
};

export default PrettyTime;
