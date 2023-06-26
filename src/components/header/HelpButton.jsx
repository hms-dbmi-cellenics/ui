import React, { useState } from 'react';
import { Button, Dropdown, Card } from 'antd';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import config from 'config';
import nextConfig from 'next/config';
import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId;
const { BIOMAGE, HMS } = AccountId;
const HelpButton = () => {
  const [visible, setVisible] = useState(false);

  const overlay = () => (
    <Card size='small' style={{ padding: '1em', width: '265px' }}>
      {(accountId === BIOMAGE) && (
      <>
        Ask questions about how to use Cellenics and make feature requests on the
          {' '}
        <a href='https://community.biomage.net/' target='_blank' rel='noreferrer'>Cellenics community forum</a>
        !
        The Biomage team will reply to your message as soon as possible.
        <br />
        <br />
      </>
      )}
      {(accountId !== HMS) && (
      <>
        Check out the
          {' '}
        <a href='https://www.biomage.net/user-guide' target='_blank' rel='noreferrer'>
          user guide
        </a>
      </>
      )}

      For 1-2-1 support with your analysis, contact
      {' '}
      <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
    </Card>
  );

  return (
    <Dropdown
      visible={visible}
      onVisibleChange={(v) => setVisible(v)}
      overlay={overlay}
      placement='bottomRight'
      trigger='click'
    >
      <Button
        type='dashed'
        icon={<QuestionCircleOutlined />}
      >
        Need help?
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default HelpButton;
