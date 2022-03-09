import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserAddOutlined, MenuOutlined } from '@ant-design/icons';
import {
  Modal, Button, Space, Row, Col, Card, Avatar, Select, Typography,
} from 'antd';
import Auth from '@aws-amplify/auth';
import fetchAPI from 'utils/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';

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
    const response = await fetchAPI(`/v1/access/${experimentId}`);
    const responseJson = await response.json();
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
    const invalidEmail = newUser && !newUser?.toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
    if (!invalidEmail) {
      setAddedUsers(selectedUsers);
    }
  };

  const okButtonText = addedUsers.length ? 'Add' : 'Done';
  const cancelButton = addedUsers.length ? (
    <Button onClick={() => setAddedUsers([])}>Cancel</Button>) : null;

  const inviteUsers = async () => {
    if (!addedUsers.length) return;

    const requests = addedUsers.map((user) => (
      fetchAPI(`/v1/access/${experimentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectUuid: activeProjectUuid,
          role,
          userEmail: user,
        }),
      })));

    const responses = await Promise.all(requests)
      .then((res) => (
        Promise.all(
          res.map((data) => data.json()),
        )));

    responses.forEach((response, indx) => {
      if (!response?.data?.code === 200) {
        pushNotificationMessage('success', `${addedUsers[indx]} added to ${experimentName}, they should have been notified.`);
      } else {
        pushNotificationMessage('error', response.message);
      }
    });
    onCancel();
  };

  const revokeRole = async (userEmail) => {
    const response = await fetchAPI(`/v1/access/${experimentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
      }),
    });

    if (!response.ok) {
      pushNotificationMessage('error', 'Error revoking access. You may not have permissions to do this.');
    } else {
      pushNotificationMessage('success', `${userEmail} removed from ${experimentName}.`);
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
      width='600px'
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
              placeholder='Input valid email addresses with enter'
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
          <Card key='users' style={{ width: '100%', height: '25rem', overflowY: 'auto' }}>
            {
              usersWithAccess.map((user) => (
                <Row gutter={10}>
                  <Col span={4}>
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
                  <Col span={3}>
                    <p>{user.role}</p>
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
