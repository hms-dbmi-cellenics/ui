import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { UserAddOutlined, DownOutlined } from '@ant-design/icons';
import {
  Modal, Button, Space, Dropdown, Menu, Row, Col, Card, Avatar, Select,
} from 'antd';
import fetchAPI from 'utils/fetchAPI';

const ShareExperimentModal = (props) => {
  const { onCancel, experimentId } = props;
  const [users, setUsers] = useState([]);

  const loadRoles = async () => {
    const response = await fetchAPI(`/v1/access/${experimentId}`);
    const responseJson = await response.json();
    setUsers(responseJson);
    console.log('RESPONSE WAS ', responseJson);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const permissionsMenu = (
    <Menu>
      <Menu.Item key='view'>
        Viewer
      </Menu.Item>
      <Menu.Item key='explore'>
        Explorer
      </Menu.Item>
      <Menu.Item key='owner'>
        Owner
      </Menu.Item>
    </Menu>
  );

  return (
    <Modal
      visible
      title={[<UserAddOutlined />, ' Share with people']}
      onCancel={onCancel}
      width='600px'
    >
      <Space direction='vertical' style={{ width: '100%' }}>
        <Row gutter={10} style={{ width: '110%' }}>
          <Col span={18}>
            <Select style={{ width: '100%' }} mode='tags' placeholder='Add people' />
          </Col>
          <Col span={6}>
            <Dropdown overlay={permissionsMenu}>
              <Button>
                Role
                <DownOutlined />
              </Button>
            </Dropdown>
          </Col>
        </Row>

        <Row>
          <Card style={{ width: '100%' }}>
            {
              users.map((user) => (
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
                    <p>{user.name}</p>
                    <p>{user.email}</p>
                  </Col>
                  <Col span={3}>
                    <p>{user.role}</p>
                  </Col>
                  <Col span={2}>
                    <Button type='primary' danger>Revoke</Button>
                  </Col>
                </Row>
              ))
            }
            <Row gutter={10} />
          </Card>
        </Row>
      </Space>
    </Modal>
  );
};

ShareExperimentModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  experimentId: PropTypes.string.isRequired,
};

export default ShareExperimentModal;
