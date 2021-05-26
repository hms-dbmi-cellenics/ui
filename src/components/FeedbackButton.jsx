import React, { useState } from 'react';
import {
  Button, Dropdown, Card, Input, Space,
} from 'antd';
import { CommentOutlined, DownOutlined } from '@ant-design/icons';
import messages from './notification/messages';
import pushNotificationMessage from '../utils/pushNotificationMessage';

const { TextArea } = Input;

const FeedbackButton = () => {
  const [visible, setVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const HOOK_URL = 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAxOVlCQVJYSjkvTWNwRnF5RGtHSmE1WTd0dGFSZHpoQXNQ'; // pragma: allowlist secret

  const submitFeedback = async () => {
    setVisible(false);

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
            {
              type: 'mrkdwn',
              text: '*URL posted from:*',
            },
            {
              type: 'mrkdwn',
              text: window.location.href,
            },
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
      pushNotificationMessage('success', messages.feedbackSuccessful, 5);
    } catch {
      pushNotificationMessage('error', messages.feedbackError, 5);
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
