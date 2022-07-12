import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Modal, Space, Checkbox, Typography, Link,
} from 'antd';

const { Text } = Typography;

const agreedPrivacyPolicyKey = 'custom:agreed_terms';
const agreedEmailsKey = 'custom:agreed_emails';

const PrivacyPolicyIntercept = (props) => {
  const { user } = props;

  const {
    attributes: {
      [agreedPrivacyPolicyKey]: originalAgreedPrivacyPolicy,
      [agreedEmailsKey]: originalAgreedEmails,
    },
  } = user;

  const [agreedPrivacyPolicy, setAgreedPrivacyPolicy] = useState(originalAgreedPrivacyPolicy);
  const [agreedEmails, setAgreedEmails] = useState(originalAgreedEmails);

  const privacyPolicyUrl = 'https://static1.squarespace.com/static/5f355513fc75aa471d47455c/t/61f12e7b7266045b4cb137bc/1643196027265/Biomage_Privacy_Policy_Jan2022.pdf';

  return (
    <Modal
      title='Initial set up'
      visible
      cancelButtonProps={{ style: { display: 'none' } }}
      okButtonProps={{ disabled: agreedPrivacyPolicy !== 'true' }}
      onOk={() => { }}
    >
      <Space direction='vertical'>
        In order to begin using the platform, blablabla

        <Space align='start'>
          <Checkbox
            defaultChecked={agreedPrivacyPolicy === 'true'}
            onChange={(e) => setAgreedPrivacyPolicy(e.target.checked.toString())}
          />
          <Text>
            I accept the terms of the
            {' '}
            <a href={privacyPolicyUrl} target='_blank' rel='noreferrer'> Biomage privacy policy</a>
            .
          </Text>
          <span style={{ color: '#ff0000' }}>*</span>
        </Space>
        <Space align='start'>
          <Checkbox
            defaultChecked={agreedEmails === 'true'}
            onChange={(e) => setAgreedEmails(e.target.checked.toString())}
          />
          <Text>
            I agree to receive updates about new features in Cellenics,
            research done with Cellenics, and Cellenics community events. (No external marketing.)
          </Text>
        </Space>
      </Space>
    </Modal>
  );
};

PrivacyPolicyIntercept.propTypes = { user: PropTypes.object.isRequired };

PrivacyPolicyIntercept.defaultProps = {};

export default PrivacyPolicyIntercept;
