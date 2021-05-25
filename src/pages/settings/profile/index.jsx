import React, { useEffect, useState, useRef } from 'react';
import { Auth } from 'aws-amplify';
import _ from 'lodash';
import {
  Form, Input, Empty, PageHeader, Space, Card, Row, Col, Button,
} from 'antd';
import FeedbackButton from '../../../components/FeedbackButton';

const ProfileSettings = () => {
  const [user, setUser] = useState();
  // const changedUserAttributes = useRef({});
  // const changedPasswordAttributes = useRef({});
  const [oldPasswordError, setOldPasswordError] = useState(false);

  const [newAttributes, setNewAttributes] = useState({
    changedUserAttributes: {},
    changedPasswordAttributes: {},
  });

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
    console.log('updating details ', newAttributes);

    const { changedPasswordAttributes, changedUserAttributes } = newAttributes;

    validateInputs();

    if (Object.keys(changedUserAttributes).length) {
      console.log('updating user details something ');
      await Auth.updateUserAttributes(user, changedUserAttributes);
    }
    if (Object.keys(changedPasswordAttributes).length) {
      const { oldPassword, newPassword } = changedPasswordAttributes;
      setOldPasswordError(false);
      await Auth.changePassword(user, oldPassword, newPassword)
        .then((response) => console.log('RESPONSE FROM CHANGIN PASS IS ', response))
        .catch((error) => { console.log('error was ', error); setOldPasswordError(error); });
    }
    currentUser();
  };

  const validateInputs = () => {
    console.log('something ');
  };

  if (user) {
    console.log('checking something ', !Object.keys(newAttributes.changedPasswordAttributes).length, 'again ', !Object.keys(newAttributes.changedUserAttributes).length);
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
            <Col>

              <Form layout='horizontal'>
                <h2>Profile settings:</h2>
                <Form.Item label='Full name'>
                  <Input
                    onChange={(e) => setChanges({ changedUserAttributes: { name: e.target.value } })}
                    placeholder={user.attributes.name}
                  />
                </Form.Item>
                <Form.Item label='Email address:'>
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
                  label='Current password:'
                  validateStatus={oldPasswordError ? 'error' : 'success'}
                  help={oldPasswordError ? "Doesn't match old password" : ''}
                >
                  <Input.Password
                    onChange={(e) => setChanges({ changedPasswordAttributes: { oldPassword: e.target.value } })}
                    visibilityToggle={false}
                  />
                </Form.Item>
                <Form.Item label='New password:'>
                  <Input.Password
                    onChange={(e) => setChanges({ changedPasswordAttributes: { newPassword: e.target.value } })}
                    visibilityToggle={false}
                  />
                </Form.Item>
                <Form.Item label='Confirm new password:'>
                  <Input.Password
                    visibilityToggle={false}
                  />
                </Form.Item>
              </Form>
              <Button
                onClick={() => updateDetails()}
                // disabled={(!Object.keys(changedPasswordAttributes.current).length && !Object.keys(changedUserAttributes.current).length)}
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
