import React from 'react';
import { Result, Typography, Space } from 'antd';
import PropTypes from 'prop-types';
import Auth from '@aws-amplify/auth';
import FeedbackButton from 'components/FeedbackButton';

const { Title, Text } = Typography;

const getPageContext = () => [
  {
    type: 'mrkdwn',
    text: '*URL posted from:*',
  },
  {
    type: 'mrkdwn',
    text: window.location.href,
  },
];

const getUserContext = async () => {
  let user = null;

  try {
    user = await Auth.currentAuthenticatedUser();
  } catch (e) {
    console.warn('User not authenticated');
    return [
      {
        type: 'mrkdwn',
        text: 'User not authenticated',
      },
    ];
  }

  return [
    {
      type: 'mrkdwn',
      text: '*User email:*',
    },
    {
      type: 'mrkdwn',
      text: user.attributes.email,
    },

    {
      type: 'mrkdwn',
      text: '*User name:*',
    },
    {
      type: 'plain_text',
      text: user.attributes.name,
    },

    {
      type: 'mrkdwn',
      text: '*User UUID:*',
    },
    {
      type: 'plain_text',
      text: user.username,
    },
  ];
};

const buildErrorMessage = (errorText, statusCode) => {
  let message = errorText || 'No error text provided';
  if (statusCode) message += ` (${statusCode})`;
  return message;
};

const postErrorToSlack = async (errorText, statusCode) => {
  const pageContext = getPageContext();
  const userContext = await getUserContext();
  const errorMessage = buildErrorMessage(errorText, statusCode);

  const messageData = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: errorMessage,
        },
      },
      {
        type: 'context',
        elements: [
          ...pageContext,
          ...userContext,
        ],
      },
    ],
  };

  try {
    const { getWebhookUrl } = await import('../utils/crypt');

    const r = await fetch(getWebhookUrl(), {
      method: 'POST',
      body: JSON.stringify(messageData),
    });

    if (!r.ok) {
      throw new Error('Invalid status code returned.');
    }
  } catch (error) {
    console.error(error);
  }
};

const Error = (props) => {
  console.log('*** props', props);

  const { errorText, statusCode } = props;

  console.log('*** errorText', errorText);
  console.log('*** statusCode', errorText);

  postErrorToSlack(errorText, statusCode);

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
        <Space direction='vertical' style={{ width: '100%' }}>
          <FeedbackButton />
        </Space>
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
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
