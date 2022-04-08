import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserAddOutlined } from '@ant-design/icons';
import {
  Modal, Button, Space, Row, Col, Card, Avatar, Select, Typography,
} from 'antd';
import Auth from '@aws-amplify/auth';
import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

const { Text } = Typography;

const ShareExperimentModal = (props) => {
  const { onCancel, activeProject } = props;
  const [usersWithAccess, setUsersWithAccess] = useState([]);
  const experimentId = activeProject.experiments[0];
  const experimentName = activeProject.name;
  const activeProjectUuid = activeProject.uuid;
  const [addedUsers, setAddedUsers] = useState([]);
  const [role, setRole] = useState('explorer');
  const [currentUser, setCurrentUser] = useState(null);
  const loadRoles = async () => {
    const responseJson = await fetchAPI(`/v1/access/${experimentId}`);
    const getCurrentUser = await Auth.currentAuthenticatedUser();
    setCurrentUser(getCurrentUser.attributes.email);
    setUsersWithAccess(responseJson);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const changeSelectedUsers = (selectedUsers) => {
    const newUser = selectedUsers[selectedUsers.length - 1];
    // check if the entry is in a valid email address format
    const isEmailInvalid = newUser && !newUser?.toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    if (!isEmailInvalid) {
      setAddedUsers(selectedUsers);
    }
  };

  const okButtonText = addedUsers.length ? 'Add' : 'Done';
  const cancelButton = addedUsers.length ? (
    <Button onClick={() => setAddedUsers([])}>Cancel</Button>) : null;

  const inviteUsers = async () => {
    if (!addedUsers.length) return;

    const requests = addedUsers.map(async (user) => {
      try {
        await fetchAPI(`/v1/access/${experimentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectUuid: activeProjectUuid,
            role,
            userEmail: user,
          }),
        });
        pushNotificationMessage('success', `User ${user} has been successfully invited to view ${experimentName}.`);
      } catch (e) {
        handleError(e);
      }
    });

    await Promise.all(requests);

    onCancel();
  };

  const revokeRole = async (userEmail) => {
    try {
      await fetchAPI(`/v1/access/${experimentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
        }),
      });

      pushNotificationMessage('success', `${userEmail} removed from ${experimentName}.`);
    } catch (e) {
      handleError(e, 'Error removing user.');
    }
    onCancel();
  };

  return (
    <Modal
      visible
      title={[<UserAddOutlined />, 'Share with collaborators']}
      onCancel={onCancel}
      okButtonText='Done'
      footer={(
        <Space direction='horizontal'>
          {cancelButton}
          <Button onClick={() => inviteUsers()} type='primary'>{okButtonText}</Button>
        </Space>
      )}
      width='650px'
    >
      <Space direction='vertical' style={{ width: '100%' }}>
        <Text strong>
          {experimentName}
        </Text>
        <Row gutter={10} style={{ width: '110%' }}>

          <Col span={18}>
            <Select
              value={addedUsers}
              style={{ width: '100%' }}
              mode='tags'
              placeholder='Input an email address. Add multiple addresses with enter.'
              onChange={changeSelectedUsers}
            />
          </Col>
          <Col span={6}>
            <Select defaultValue='explorer' onChange={(val) => setRole(val)}>
              <Select.Option key='explorer' value='explorer'> Explorer </Select.Option>
            </Select>
          </Col>
        </Row>

        <Row>
          <Space direction='vertical' style={{ width: '100%' }} size='large'>

            <Card key='users' style={{ width: '100%', height: '20rem', overflowY: 'auto' }}>
              {
                usersWithAccess.map((user) => (
                  <Row gutter={10}>
                    <Col span={3}>
                      <Avatar
                        style={{
                          backgroundColor: '#f56a00',
                        }}
                        size='large'
                      >
                        {user.name[0].toUpperCase()}
                      </Avatar>
                    </Col>
                    <Col span={13} flex='auto'>
                      <p>
                        {user.name}
                        {' '}
                        {user.email === currentUser ? '(You)' : ''}
                        <br />
                        <span style={{ color: 'grey' }}>{user.email}</span>
                      </p>
                    </Col>
                    <Col span={4}>
                      <p style={{ marginTop: '0.5em' }}>{user.role}</p>
                    </Col>
                    <Col span={2}>
                      <Button
                        type='primary'
                        danger
                        onClick={() => revokeRole(user.email)}
                        disabled={user.email === currentUser}
                      >
                        Revoke
                      </Button>
                    </Col>
                  </Row>
                ))
              }
              <Row gutter={10} />
            </Card>
            <Text>
              <b>Explorer: </b>
              the user will be able to use Data Exploration and Plots and Tables modules,
              but will not be able to make any changes to samples or metadata in Data Management or
              re-run the pipeline in the Data Processing module.
            </Text>
          </Space>
        </Row>
      </Space>
    </Modal>
  );
};

ShareExperimentModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  activeProject: PropTypes.object.isRequired,
};

export default ShareExperimentModal;
