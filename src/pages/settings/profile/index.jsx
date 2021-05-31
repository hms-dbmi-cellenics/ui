import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';
import _ from 'lodash';
import {
  Form, Input, Empty, PageHeader, Card, Row, Col, Button,
} from 'antd';
import FeedbackButton from '../../../components/FeedbackButton';
import messages from '../../../components/notification/messages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const ProfileSettings = () => {
  const [user, setUser] = useState();
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

  const currentUser = () => Auth.currentAuthenticatedUser()
    .then((userData) => setUser(userData))
    .catch((e) => console.log('error during getuser', e));

  useEffect(() => {
    currentUser();
  }, []);

  const updateDetails = async () => {
    const { name, email } = changedUserAttributes;
    const { oldPassword, newPassword, confirmNewPassword } = changedPasswordAttributes;

    if (name || email) {
      setEmailError(false);
      await Auth.updateUserAttributes(user, changedUserAttributes)
        .then((response) => pushNotificationMessage('success', messages.detailsUpdated, 3))
        .catch((e) => setEmailError(true));
    }
    if (oldPassword || newPassword || confirmNewPassword) {
      setOldPasswordError(false);
      setNewPasswordError(false);
      const decimal = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/;

      if (confirmNewPassword !== newPassword) {
        setNewPasswordError("Passwords don't match.");
      } else if (!newPassword.match(decimal)) {
        setNewPasswordError('Password should include at least 8 characters, a number, special character, uppercase letter, lowercase letter.');
      } else {
        await Auth.changePassword(user, oldPassword, newPassword)
          .then((response) => pushNotificationMessage('success', messages.detailsUpdated, 3))
          .catch((error) => { setOldPasswordError("Doesn't match old password"); });
      }
    }
    currentUser();
    setChanges(initialState);
  };

  if (user) {
    return (
      <>
        <PageHeader
          title='Profile'
          extra={(
            <FeedbackButton />
          )}
        />
        <Card>

          <Row type='flex' justify='center' align='center'>
            <Col style={{ width: '40%' }}>

              <Form layout='horizontal'>
                <h2>Profile settings:</h2>
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
                    onChange={(e) => setChanges({ changedUserAttributes: { email: e.target.value } })}
                    placeholder={user.attributes.email}
                  />
                </Form.Item>
                {/* no information for the institution currently
                <Form.Item label='Institution:'>
                  <Input placeholder={user.attributes.institution} />
                </Form.Item> */}
                <h2>Password settings:</h2>
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
              <Button
                onClick={() => updateDetails()}
              >
                Save changes
              </Button>
            </Col>
          </Row>
        </Card>

      </>
    );
  }
  return (<Empty />);
};

export default ProfileSettings;
