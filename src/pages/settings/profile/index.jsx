import React, { useState } from 'react';
import Auth from '@aws-amplify/auth';
import nextConfig from 'next/config';
import _ from 'lodash';
import {
  Form, Input, Empty, Row, Col, Button, Space, Checkbox, Typography,
} from 'antd';
import { useRouter } from 'next/router';

import Header from 'components/Header';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';
import { useSelector, useDispatch } from 'react-redux';
import { loadUser } from 'redux/actions/user';

import { AccountId } from 'utils/deploymentInfo';

const accountId = nextConfig()?.publicRuntimeConfig?.accountId;

const { Text } = Typography;

const ProfileSettings = () => {
  const router = useRouter();

  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.current);

  const [oldPasswordError, setOldPasswordError] = useState(null);
  const [newPasswordError, setNewPasswordError] = useState(null);
  const [emailError, setEmailError] = useState(null);

  const initialState = {
    changedPasswordAttributes: {},
    changedUserAttributes: {},
  };
  const [newAttributes, setNewAttributes] = useState(initialState);
  const { changedPasswordAttributes, changedUserAttributes } = newAttributes;

  const setChanges = (object) => {
    const newChanges = _.cloneDeep(newAttributes);
    _.merge(newChanges, object);
    setNewAttributes(newChanges);
  };

  const agreedEmailsKey = 'custom:agreed_emails';

  const updateDetails = async () => {
    const { name, email } = changedUserAttributes;
    const { oldPassword, newPassword, confirmNewPassword } = changedPasswordAttributes;

    const invalidPasswordErrors = ['InvalidPasswordException', 'InvalidParameterException', 'NotAuthorizedException'];
    if (name || email || changedUserAttributes[agreedEmailsKey]) {
      setEmailError(false);
      await Auth.updateUserAttributes(user, changedUserAttributes)
        .then(() => pushNotificationMessage('success', endUserMessages.ACCOUNT_DETAILS_UPDATED, 3))
        .catch(() => {
          setEmailError(true);
        });
    }
    if (oldPassword || newPassword || confirmNewPassword) {
      setOldPasswordError(false);
      setNewPasswordError(false);

      // this should be updated in the case of changing the AWS Cognito password strength policy
      const passwordValidity = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/;

      if (confirmNewPassword !== newPassword) {
        setNewPasswordError("Passwords don't match.");
      } else if (oldPassword === newPassword) { // pragma: allowlist secret
        setNewPasswordError('The new password cannot match the old one.');
      } else if (!newPassword?.match(passwordValidity)) {
        setNewPasswordError('Password should include at least 8 characters, a number, special character, uppercase letter, lowercase letter.');
      } else {
        await Auth.changePassword(user, oldPassword, newPassword)
          .then(() => pushNotificationMessage('success', endUserMessages.ACCOUNT_DETAILS_UPDATED, 3))
          .catch((e) => {
            if (invalidPasswordErrors.includes(e.code)) {
              setOldPasswordError("Doesn't match old password.");
            } else {
              handleError(e, e.message);
            }
          });
      }
    }

    dispatch(loadUser());
    setChanges(initialState);
  };

  // the user might not be loaded already - then return <Empty/>
  if (user) {
    return (
      <>
        <Header
          title='Profile'
        />
        <Space direction='vertical' style={{ width: '100%', padding: '20px', background: ' white' }}>
          <Row type='flex'>
            <Col xl={{ span: 12, offset: 6 }} span={24}>

              <Form
                layout='horizontal'
                labelCol={{ span: '6' }}
                wrapperCol={{ span: '18' }}
              >
                <h2 style={{ marginTop: '16px' }}>Profile settings:</h2>
                <Form.Item label='Full name'>
                  <Input
                    onChange={(e) => setChanges({ changedUserAttributes: { name: e.target.value } })}
                    placeholder={user.attributes.name}
                  />
                </Form.Item>
                <Form.Item
                  label='Email address:'
                  validateStatus={emailError ? 'error' : 'success'}
                  help={emailError ? 'Invalid email address format' : ''}
                >
                  <Input
                    type='email'
                    // disabled until we can validate the changing of email
                    disabled
                    onChange={(e) => setChanges({ changedUserAttributes: { email: e.target.value } })}
                    placeholder={user.attributes.email}
                  />
                </Form.Item>
                {/* no information for the institution currently */}
                <Form.Item label='Institution:'>
                  <Input disabled placeholder={user.attributes.institution} />
                </Form.Item>
                {accountId !== AccountId.HMS
                  && (
                    <Form.Item
                      label='Updates: '
                    >
                      <Space align='start' style={{ marginTop: '5px' }}>
                        <Checkbox
                          defaultChecked={user.attributes[agreedEmailsKey] === 'true'}
                          onChange={(e) => setChanges({
                            changedUserAttributes: { [agreedEmailsKey]: e.target.checked.toString() },
                          })}
                        />
                        <Text>
                          I agree to receive updates about new features in Cellenics, research done with Cellenics, and Cellenics community events. (No external marketing.)
                        </Text>
                      </Space>
                    </Form.Item>
                  )}
                <h2 style={{ marginTop: '40px' }}>Password settings:</h2>
                <Form.Item
                  label='Current password:' // pragma: allowlist secret
                  validateStatus={oldPasswordError ? 'error' : 'success'}
                  help={oldPasswordError || ''}
                >
                  <Input.Password
                    onChange={(e) => setChanges({ changedPasswordAttributes: { oldPassword: e.target.value } })} // pragma: allowlist secret
                    visibilityToggle={false}
                  />
                </Form.Item>
                <Form.Item
                  label='New password:' // pragma: allowlist secret
                  validateStatus={newPasswordError ? 'error' : 'success'}
                  help={newPasswordError || ''}
                >
                  <Input.Password
                    onChange={(e) => setChanges({ changedPasswordAttributes: { newPassword: e.target.value } })} // pragma: allowlist secret
                    visibilityToggle={false}
                  />
                </Form.Item>
                <Form.Item
                  label='Confirm new password:' // pragma: allowlist secret
                  validateStatus={newPasswordError ? 'error' : 'success'}
                  help={newPasswordError || ''}
                >
                  <Input.Password
                    onChange={(e) => setChanges({ changedPasswordAttributes: { confirmNewPassword: e.target.value } })} // pragma: allowlist secret
                    visibilityToggle={false}
                  />
                </Form.Item>
              </Form>
            </Col>
          </Row>
          <Row>
            <Col xl={{ span: 12, offset: 6 }} span={24}>
              <Row justify='end'>
                <Space>
                  <Button
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='primary'
                    onClick={() => updateDetails()}
                  >
                    Save changes
                  </Button>
                </Space>
              </Row>
            </Col>
          </Row>
        </Space>

      </>
    );
  }
  return (<Empty />);
};

export default ProfileSettings;
