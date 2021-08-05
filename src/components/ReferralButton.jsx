import React, { useState } from 'react';
import {
  Button, Dropdown, Card, Input, Space, Tooltip,
} from 'antd';
import { ShareAltOutlined, DownOutlined } from '@ant-design/icons';
import { Auth } from 'aws-amplify';
import endUserMessages from '../utils/endUserMessages';
import pushNotificationMessage from '../utils/pushNotificationMessage';

const { TextArea } = Input;

const initialMessage = 'Hi,\n\nCheck out Cellscope from Biomage. It will make your single-cell analysis easier.';

// Valid email regex based on RFC2822 - https://regexr.com/2rhq7
const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const ReferralButton = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [customMessage, setCustomMessage] = useState(initialMessage);

  const HOOK_URL = 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAyQVk0ODQxQ0cvQ0x3Mms4dTBtMkUzcDBVNUhhbjBqeTBv'; // pragma: allowlist secret

  const submitFeedback = async () => {
    setVisible(false);

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

    const referralData = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: `Email: ${email}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: `Message:\n ${customMessage}`,
          },
        },
        {
          type: 'context',
          elements: [
            ...userContext,
          ],
        },
      ],
    };

    try {
      const r = await fetch(atob(HOOK_URL), {
        method: 'POST',
        body: JSON.stringify(referralData),
      });

      if (!r.ok) {
        throw new Error('Invalid status code returned.');
      }
      setEmail('');
      setCustomMessage(initialMessage);
      pushNotificationMessage('success', endUserMessages.REFERRAL_SUCCESSFUL);
    } catch (e) {
      pushNotificationMessage('error', endUserMessages.REFERRAL_ERROR);
    }
  };

  const overlay = () => (
    <div>
      <Card size='small'>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Input
            addonBefore='To: '
            label='Email'
            onChange={(e) => {
              setIsEmailValid(e.target.value.match(emailRegex));
              setEmail(e.target.value);
            }}
            placeholder={'Your friend\'s email address'}
          />
          <TextArea
            value={customMessage}
            label='Custom message'
            onChange={(e) => {
              setCustomMessage(e.target.value);
            }}
            rows={4}
            style={{
              resize: 'none', width: 300, outline: 'none',
            }}
          />
          <Space>
            <Button size='small' onClick={() => setVisible(false)}>Cancel</Button>
            <Tooltip
              title={!isEmailValid ? 'Please enter a valid email address' : ''}
            >
              <Button size='small' type='primary' disabled={!isEmailValid} onClick={submitFeedback}>Send invite</Button>
            </Tooltip>
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
      <Button type='primary' icon={<ShareAltOutlined />}>
        Invite a friend
        {' '}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ReferralButton;
