import Auth from '@aws-amplify/auth';
import postToSlack from 'utils/slack/postToSlack';

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

const buildErrorMessage = (error, info) => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Unhandled error occured:*',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Unhandled UI error occured:*',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `\`\`\`${error.stack}\`\`\``,
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*the above error occured in: *',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `\`\`\`${info.componentStack}\`\`\``,
    },
  },
];

const postErrorToSlack = async (error, info) => {
  const pageContext = getPageContext();
  const userContext = await getUserContext();

  const errorMessages = buildErrorMessage(error, info);

  const messageData = {
    blocks: [
      ...errorMessages,
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
    postToSlack(messageData);
  } catch (err) {
    console.error(err);
  }
};

export default postErrorToSlack;
