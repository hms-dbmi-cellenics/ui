import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Typography, Space,
} from 'antd';
import { ClipLoader } from 'react-spinners';

const { Text } = Typography;

const LoadingModal = (props) => {
  const {
    visible, message,
  } = props;

  return (
    <Modal
      visible={visible}
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
            {message}
          </Text>
        </Space>
      </center>
    </Modal>

  );
};

LoadingModal.propTypes = {
  visible: PropTypes.bool,
  message: PropTypes.string,
};

LoadingModal.defaultProps = {
  visible: false,
  message: 'Loading...',
};

export default LoadingModal;
