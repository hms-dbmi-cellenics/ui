import {
  Button,
  Card,
  Dropdown,
  Input,
  Space,
  Tooltip,
} from 'antd';
import { DownOutlined, ShareAltOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import Auth from '@aws-amplify/auth';
import handleError from 'utils/http/handleError';
import validateInput, { rules } from 'utils/validateInputs';

import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';

const { TextArea } = Input;

const initialMessage = 'Hi,\n\nCheck out Cellenics. It will make your single-cell analysis easier.';

const ReferralButton = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [customMessage, setCustomMessage] = useState(initialMessage);

  const HOOK_URL = 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDAxNTVEWkZWTTAvQjAyQVk0ODQxQ0cvQ0x3Mms4dTBtMkUzcDBVNUhhbjBqeTBv'; // pragma: allowlist secret

  const submitReferral = async () => {
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
        text: '*From:*',
      },
      {
        type: 'mrkdwn',
        text: user.attributes.name,

      },

      {
        type: 'mrkdwn',
        text: '*Email:*',
      },
      {
        type: 'plain_text',
        text: user.attributes.email,
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
            text: `To: ${email}`,
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
          type: 'divider',
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
      handleError(e, endUserMessages.REFERRAL_ERROR);
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
              const { isValid } = validateInput(e.target.value, rules.VALID_EMAIL);

              setIsEmailValid(isValid);
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
              <Button size='small' type='primary' disabled={!isEmailValid} onClick={submitReferral}>Send invite</Button>
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
      <Button type='dashed' icon={<ShareAltOutlined />}>
        Invite a friend
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ReferralButton;
