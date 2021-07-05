import React, { useState } from 'react';
import {
  Button, Dropdown, Card, Input, Space,
} from 'antd';
import { CommentOutlined, DownOutlined } from '@ant-design/icons';
import { Auth } from 'aws-amplify';
import endUserMessages from '../utils/endUserMessages';
import pushNotificationMessage from '../utils/pushNotificationMessage';

const { TextArea } = Input;

const FeedbackButton = () => {
  const [visible, setVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const HOOK_URL = 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAxOVlCQVJYSjkvTWNwRnF5RGtHSmE1WTd0dGFSZHpoQXNQ'; // pragma: allowlist secret

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
      console.warn('User not authenticated')
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
      const r = await fetch(atob(HOOK_URL), {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });

      if (!r.ok) {
        throw new Error('Invalid status code returned.');
      }
      setFeedbackText('');
      pushNotificationMessage('success', endUserMessages.FEEDBACK_SUCCESSFUL);
    } catch {
      pushNotificationMessage('error', endUserMessages.FEEDBACK_ERROR);
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
            placeholder='Feedback?'
            bordered={false}
            ref={(ref) => { if (ref) { ref.focus(); } }}
            style={{
              resize: 'none', width: 300, border: 'none', outline: 'none',
            }}
          />
          <Space>
            <Button size='small' onClick={() => setVisible(false)}>Cancel</Button>
            <Button size='small' type='primary' onClick={submitFeedback}>Send feedback</Button>
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
        Feedback?
        {' '}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default FeedbackButton;
