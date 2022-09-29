import React, { useState, useEffect } from 'react';
import {
  Button, Empty, Typography,
} from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';

import WorkResponseError from 'utils/errors/http/WorkResponseError';
import WorkGenericError from 'utils/errors/http/WorkGenericError';
import WorkTimeoutError from 'utils/errors/http/WorkTimeoutError';

const { Text } = Typography;

const PlatformError = (props) => {
  const {
    description, error, actionable, onClick,
  } = props;

  let { reason } = props;

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
    reason = reason ?? 'That\'s all we know';

    if (error instanceof WorkResponseError) {
      reason = 'We had an error on our side while we were completing your request.';
    } else if (error instanceof WorkTimeoutError) {
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
    } else if (error instanceof WorkGenericError) {
      reason = error.message;
    }

    return (
      <>
        <Text type='primary'>
          {description || 'We\'re sorry, we couldn\'t load this. '}
        </Text>
        <br />
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
        display: 'block',
        marginLeft: 'auto',
        marginRight: 'auto',
        width: '50%',
      }}
      description={renderMessage(error)}
    >

      {actionable ? (

        <Button
          type='primary'
          onClick={onClick || window.location.reload()}
        >
          Try again
        </Button>

      ) : ''}

    </Empty>
  );
};

PlatformError.propTypes = {
  description: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.string, PropTypes.object, PropTypes.bool,
  ]),
  actionable: PropTypes.bool,
  onClick: PropTypes.func,
  reason: PropTypes.string,
};

PlatformError.defaultProps = {
  description: null,
  error: null,
  actionable: true,
  onClick: null,
  reason: null,
};

export default PlatformError;
