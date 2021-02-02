import React from 'react';
import { Result, Typography, Space } from 'antd';

import FeedbackButton from '../components/FeedbackButton';

const { Title, Text } = Typography;

const Error = ({ errorText, statusCode }) => (
  <Result
    title={<Title level={2}>It&apos;s not you, it&apos;s us.</Title>}
    icon={(
      <img
        alt='Illustration of people looking into bushes to find something.'
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
            If you need immediate help, please
            {' '}
            <a href='mailto:hello@biomage.net'>contact us</a>
            .
            {' '}
            If the problem persists,
            please leave feedback using the button below.
            <br />
            Thank you for your patience, we&apos;ll be up and running shortly.
          </Text>

          {statusCode && <Text type='secondary'>{`HTTP ${statusCode}`}</Text>}

          {errorText && (
            <>
              <span>
                <Text type='secondary'>The error is reported to be the following:&nbsp;</Text>
                <Text code>{errorText}</Text>
              </span>
            </>
          )}

        </Space>
      </>
    )}
    extra={(
      <Space direction='vertical' style={{ width: '100%' }}>
        <FeedbackButton />
      </Space>
    )}
  />
);

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
