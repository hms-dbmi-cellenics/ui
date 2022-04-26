import React, { useState } from 'react';
import { Button, Dropdown, Card } from 'antd';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';

const HelpButton = () => {
  const [visible, setVisible] = useState(false);

  const overlay = () => (
    <Card size='small' style={{ padding: '1em', width: '265px' }}>
      For tutorial videos, ‘how to’ guides and FAQs on how to use Cellenics, visit
      {' '}
      <a href='https://www.biomage.net/get-started' target='_blank' rel='noreferrer'>our website</a>
      .
      <br />
      <br />
      If you need additional help with your analysis, email:
      {' '}
      <a href='mailto:hello@biomage.net'>hello@biomage.net</a>
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
        Help & resources
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default HelpButton;
