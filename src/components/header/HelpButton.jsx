import React, { useState } from 'react';
import { Button, Dropdown, Card } from 'antd';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import getDomainSpecificContent from 'utils/getDomainSpecificContent';

const HelpButton = () => {
  const [visible, setVisible] = useState(false);
  const overlay = () => (
    <Card size='small' style={{ padding: '1em', width: '265px' }}>
      {getDomainSpecificContent('HelpButton')}
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
