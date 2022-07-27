import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserAddOutlined } from '@ant-design/icons';
import {
  Modal, Button, Space, Row, Col, Card, Avatar, Select, Typography,
} from 'antd';
import Auth from '@aws-amplify/auth';
import loadRoles from 'utils/data-management/experimentSharing/loadRoles';
import sendInvites from 'utils/data-management/experimentSharing/sendInvites';
import revokeRole from 'utils/data-management/experimentSharing/revokeRole';

const { Text } = Typography;

const ShareExperimentModal = (props) => {
  const { onCancel, experiment } = props;
  const [usersWithAccess, setUsersWithAccess] = useState([]);
  const [addedUsers, setAddedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('explorer');

  const fetchRoles = async () => {
    const getCurrentUser = await Auth.currentAuthenticatedUser();
    setCurrentUser(getCurrentUser.attributes.email);

    const userRole = await loadRoles(experiment.id);
    setUsersWithAccess(userRole);
  };

  useEffect(() => {
    fetchRoles();
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

    await sendInvites(
      addedUsers,
      {
        experimentId: experiment.id,
        experimentName: experiment.name,
        role,
      },
    );

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
          {experiment.name}
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
                        onClick={() => {
                          revokeRole(
                            user.email,
                            { experimentId: experiment.id, experimentName: experiment.name },
                          );

                          onCancel();
                        }}
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
  experiment: PropTypes.object.isRequired,
};

export default ShareExperimentModal;
