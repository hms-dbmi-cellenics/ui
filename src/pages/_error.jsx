import React from 'react';
import {
  Result, Typography, Space, Button,
} from 'antd';
import PropTypes from 'prop-types';
import FeedbackButton from 'components/FeedbackButton';

const { Title, Text } = Typography;

const Error = ({ errorText, statusCode }) => {
  console.log('*** error', errorText);
  console.log('*** statusCode', statusCode);

  return (
    <Result
      title={<Title level={2}>It&apos;s not you, it&apos;s us.</Title>}
      icon={(
        <img
          alt='A creature ripping the cable between a PC and a server (illustration).'
          src='/undraw_server_down_s4lk.svg'
          width={250}
          height={250}
        />
      )}
      subTitle={(
        <>
          <Title
            level={4}
            style={{ fontWeight: 'normal' }}
          >
            Sorry, something went wrong on our end. We&apos;re working hard to fix the problem.
          </Title>

          <Space direction='vertical' style={{ width: '100%' }}>
            <Text>
              If you need immediate help, or if the problem persists,
              please leave feedback using the button below.
              <br />
              Thank you for your patience, we&apos;ll be up and running shortly.
            </Text>

            {statusCode && <Text type='secondary'>{`HTTP ${statusCode}`}</Text>}

            {errorText && (
              <>
                <span>
                  <Text type='secondary'>The error is reported as:&nbsp;</Text>
                  <Text code>{errorText}</Text>
                </span>
              </>
            )}

          </Space>
        </>
      )}
      extra={(
        <center>
          <Space>
            <FeedbackButton />
            <Button type='primary' onClick={() => window.location.reload()}>Reload Page</Button>
          </Space>
        </center>
      )}
    />
  );
};

Error.defaultProps = {
  statusCode: null,
  errorText: null,
};

Error.propTypes = {
  statusCode: PropTypes.number,
  errorText: PropTypes.string,
};

Error.getInitialProps = ({ res, err }) => {
  console.log('*** res', res);
  console.log('*** err', err);

  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
