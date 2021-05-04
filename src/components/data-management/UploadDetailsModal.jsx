import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Col, Row, Space, Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const UploadDetailsModal = (props) => {
  const {
    visible, onRetry, onReplace, onCancel,
  } = props;

  return (
    <Modal
      title='Upload error'
      visible={visible}
      onCancel={onCancel}
      width='40%'
      footer={(
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type='primary'
            key='retry'
            block
            onClick={() => {
              onRetry();
            }}
            style={{ marginRight: '30px' }}
          >
            Retry upload
          </Button>
          <Button
            type='primary'
            key='replace'
            block
            onClick={() => {
              onReplace();
            }}
            style={{ marginLeft: '30px' }}
          >
            Replace file
          </Button>
        </Space>
      )}
    >
      <div style={{ width: '100%', marginLeft: '15px' }}>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          The following file has failed to upload
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Sample</Col>
          <Col span={10}>Sample 1</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Category</Col>
          <Col span={10}>matrix.mtx</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Filename</Col>
          <Col span={10}>sample1/matrix.mtx</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Error</Col>
          <Col span={10}>Invalid file type</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Replace with</Col>
          <Col span={10} style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ marginRight: '50px' }}>/User/username/file.mtx</div>

            <Upload>
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

UploadDetailsModal.propTypes = {
  visible: PropTypes.bool,
  onRetry: PropTypes.func,
  onReplace: PropTypes.func,
  onCancel: PropTypes.func,
};

UploadDetailsModal.defaultProps = {
  visible: true,
  onRetry: null,
  onReplace: null,
  onCancel: null,
};

export default UploadDetailsModal;
