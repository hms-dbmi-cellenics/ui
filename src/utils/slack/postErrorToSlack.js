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
    type: 'mrkdwn',
    text: '*Error:*',
  },
  {
    type: 'mrkdwn',
    text: error.message,
  },
  {
    type: 'mrkdwn',
    text: `\`\`\`${error.stack}\`\`\``,
  },
  {
    type: 'mrkdwn',
    text: '*the above error occured in: *',
  },
  {
    type: 'mrkdwn',
    text: `\`\`\`${info.ComponentStack}\`\`\``,
  },
];

const postErrorToSlack = async (error, info) => {
  const pageContext = getPageContext();
  const userContext = await getUserContext();
  const errorMessage = buildErrorMessage(error, info);

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
    postToSlack(messageData);
  } catch (err) {
    console.error(err);
  }
};

export default postErrorToSlack;
