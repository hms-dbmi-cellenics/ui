import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space,
} from 'antd';
import { ClipLoader } from 'react-spinners';

const { Text } = Typography;

const LoadingModal = () => (
  <Modal
    maskClosable={false}
    closable={false}
    footer={null}
    width={200}
  >
    <center>
      <Space direction='vertical'>
        <ClipLoader
          size={50}
          color='#8f0b10'
        />
        <Text>
          Loading...
        </Text>
      </Space>
    </center>
  </Modal>

);

export default LoadingModal;
