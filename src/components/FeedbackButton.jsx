import {
  Button,
  Card,
  Dropdown,
  Input,
  Space,
} from 'antd';
import { CommentOutlined, DownOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

import Auth from '@aws-amplify/auth';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

const { TextArea } = Input;

const FeedbackButton = () => {
  const [visible, setVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const submitFeedback = async () => {
    setVisible(false);

    const pageContext = [
      {
        type: 'mrkdwn',
        text: '*URL posted from:*',
      },
      {
        type: 'mrkdwn',
        text: window.location.href,
      },
    ];

    let user;
    try {
      user = await Auth.currentAuthenticatedUser();
    } catch (e) {
      console.warn('User not authenticated');
    }

    const userContext = user ? [
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
    ] : [];

    const feedbackData = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: feedbackText,
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
      const { getWebhookUrl } = await import('utils/slack');
      const r = await fetch(getWebhookUrl(), {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });

      if (!r.ok) {
        throw new Error('Invalid status code returned.');
      }
      setFeedbackText('');
      pushNotificationMessage('success', endUserMessages.FEEDBACK_SUCCESSFUL);
    } catch (e) {
      handleError(e, endUserMessages.FEEDBACK_ERROR);
    }
  };

  const overlay = () => (
    <div>
      <Card size='small'>
        <Space direction='vertical' style={{ width: '100%' }}>
          <TextArea
            value={feedbackText}
            onChange={(e) => {
              setFeedbackText(e.target.value);
            }}
            rows={4}
            placeholder={'Please write your feedback/issues here. We\'ll get back to you ASAP'}
            bordered={false}
            ref={(ref) => { if (ref) { ref.focus(); } }}
            style={{
              resize: 'none', width: 300, border: 'none', outline: 'none',
            }}
          />
          <Space>
            <Button size='small' onClick={() => setVisible(false)}>Cancel</Button>
            <Button size='small' type='primary' onClick={submitFeedback}>Send</Button>
          </Space>
        </Space>
      </Card>
    </div>
  );

  return (
    <Dropdown
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      overlay={overlay}
      placement='bottomRight'
      trigger='click'
    >
      <Button type='dashed' icon={<CommentOutlined />}>
        Feedback or issues?
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default FeedbackButton;
