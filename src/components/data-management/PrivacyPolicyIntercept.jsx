import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Auth from '@aws-amplify/auth';

import {
  Modal, Space, Checkbox, Typography,
} from 'antd';

import styles from 'components/data-management/PrivacyPolicyIntercept.module.css';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

const { Text } = Typography;

const agreedPrivacyPolicyKey = 'custom:agreed_terms';
const agreedEmailsKey = 'custom:agreed_emails';

const PrivacyPolicyIntercept = (props) => {
  const { user, onOk } = props;

  const {
    attributes: {
      [agreedPrivacyPolicyKey]: originalAgreedPrivacyPolicy,
      [agreedEmailsKey]: originalAgreedEmails,
    },
  } = user;

  const [agreedPrivacyPolicy, setAgreedPrivacyPolicy] = useState(originalAgreedPrivacyPolicy);
  const [agreedEmails, setAgreedEmails] = useState(originalAgreedEmails ?? 'false');

  const privacyPolicyUrl = 'https://static1.squarespace.com/static/5f355513fc75aa471d47455c/t/64e74c9b4fc1e66b2434b9fb/1692880027872/Biomage_PrivacyPolicy_Aug2023.pdf';

  return (
    <Modal
      title='Agree to the Biomage privacy policy to continue using Cellenics'
      visible
      centered
      className={styles['ok-to-the-right-modal']}
      cancelText='Sign out'
      cancelButtonProps={{ danger: true }}
      okButtonProps={{ disabled: agreedPrivacyPolicy !== 'true' }}
      closable={false}
      maskClosable={false}
      onOk={async () => {
        await Auth.updateUserAttributes(
          user,
          {
            [agreedPrivacyPolicyKey]: agreedPrivacyPolicy,
            [agreedEmailsKey]: agreedEmails,
          },
        )
          .then(() => {
            pushNotificationMessage('success', endUserMessages.ACCOUNT_DETAILS_UPDATED, 3);
            onOk();
          })
          .catch(() => pushNotificationMessage('error', endUserMessages.ERROR_SAVING, 3));
      }}
      onCancel={async () => Auth.signOut()}
    >
      <Space direction='vertical'>
        <Space align='start'>
          <Checkbox
            defaultChecked={agreedPrivacyPolicy === 'true'}
            onChange={(e) => setAgreedPrivacyPolicy(e.target.checked.toString())}
          />
          <Text>
            <span style={{ color: '#ff0000' }}>* </span>
            I accept the terms of the
            {' '}
            <a href={privacyPolicyUrl} target='_blank' rel='noreferrer'> Biomage privacy policy</a>
            .
          </Text>
        </Space>
        <Space align='start'>
          <Checkbox
            defaultChecked={agreedEmails === 'true'}
            onChange={(e) => setAgreedEmails(e.target.checked.toString())}
            style={{ marginRight: 10 }}
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

PrivacyPolicyIntercept.propTypes = {
  user: PropTypes.object.isRequired,
  onOk: PropTypes.func.isRequired,
};

PrivacyPolicyIntercept.defaultProps = {};

export default PrivacyPolicyIntercept;
