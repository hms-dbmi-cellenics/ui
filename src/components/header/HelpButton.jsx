import React, { useState } from 'react';
import { Button, Dropdown, Card } from 'antd';
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons';
import config from 'config';
import returnDomainSpecificContent from 'utils/domainSpecificContent.jsx';
import PropTypes from 'prop-types';

const HelpButton = (props) => {
  const { accountId } = props;
  const [visible, setVisible] = useState(false);
  console.log('ACCOUNT ID ', accountId);
  const overlay = () => (
    <Card size='small' style={{ padding: '1em', width: '265px' }}>
      {returnDomainSpecificContent('HelpButton', accountId)}
      <br />
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
HelpButton.propTypes = {
  accountId: PropTypes.string.isRequired,
};
export default HelpButton;
