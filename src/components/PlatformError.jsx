import React, { useState, useEffect } from 'react';
import {
  Button, Empty, Typography,
} from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';

import WorkResponseError from '../utils/WorkResponseError';
import WorkTimeoutError from '../utils/WorkTimeoutError';

const { Text } = Typography;

const PlatformError = (props) => {
  const { description, error, onClick } = props;

  const [relativeTime, setRelativeTime] = useState('just now');

  useEffect(() => {
    if (!error?.timeout) {
      return;
    }

    const interval = setInterval(() => setRelativeTime(moment(error.timeout).fromNow()), 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const renderMessage = () => {
    let reason = 'That\'s all we know';

    if (error instanceof WorkResponseError) {
      reason = 'We had an error on our side while we were completing your request.';
    }

    if (error instanceof WorkTimeoutError) {
      reason = (
        <>
          We were expecting your request to arrive
          {' '}
          {relativeTime}
          , but we were too slow.
          <br />
          We stopped waiting so you can try again.
        </>
      );
    }

    return (
      <>
        <Text type='primary'>
          {description || 'We\'re sorry, we couldn\'t load this.'}
        </Text>
        <Text type='secondary'>
          {reason}
        </Text>
      </>
    );
  };

  return (
    <Empty
      image={(
        <img
          alt='A woman with a paintbrush staring at an empty canvas (illustration).'
          src='/undraw_blank_canvas_3rbb.svg'
        />
      )}
      imageStyle={{
        height: 120,
      }}
      description={renderMessage(error)}
    >
      <Button
        type='primary'
        onClick={onClick || window.location.reload()}
      >
        Try again
      </Button>

    </Empty>
  );
};

PlatformError.defaultProps = {
  description: null,
  error: null,
  onClick: null,
};

PlatformError.propTypes = {
  description: PropTypes.string,
  error: PropTypes.string,
  onClick: PropTypes.func,
};

export default PlatformError;
