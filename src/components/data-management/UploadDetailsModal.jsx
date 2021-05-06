import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Col, Row,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const UploadDetailsModal = (props) => {
  const {
    sampleName, fileName, pathTo, status, visible, onUpload, onCancel,
  } = props;

  const inputFileRef = useRef(null);
  const [replacementFileBundle, setReplacementFileBundle] = useState(null);

  useEffect(() => {
    if (replacementFileBundle) {
      onUpload(replacementFileBundle);
    }
  }, [replacementFileBundle]);

  return (
    <Modal
      title='Upload error'
      visible={visible}
      onCancel={onCancel}
      width='40%'
      footer={(
        <Row style={{ width: '100%', justifyContent: 'center' }}>
          <Col>
            <Button
              type='primary'
              key='retry'
              block
              onClick={() => {
                onUpload();
              }}
              style={{ width: '140px', marginBottom: '10px' }}
            >
              Retry upload
            </Button>
          </Col>
          <Col span='2' />
          <Col>
            <input
              type='file'
              id='file'
              ref={inputFileRef}
              style={{ display: 'none' }}
              onChange={
                (event) => {
                  setReplacementFileBundle(event.target.files[0]);
                }
              }
            />
            <Button
              type='primary'
              key='replace'
              block
              icon={<UploadOutlined />}
              onClick={() => {
                inputFileRef.current.click();
              }}
              style={{ width: '140px', marginBottom: '10px' }}
            >
              Replace file
            </Button>
          </Col>
        </Row>
      )}
    >
      <div style={{ width: '100%', marginLeft: '15px' }}>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          The following file has failed to upload
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Sample</Col>
          <Col span={10}>{sampleName}</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Category</Col>
          <Col span={10}>{fileName}</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Filename</Col>
          <Col span={10}>{pathTo}</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Error</Col>
          <Col span={10}>{status?.message()}</Col>
        </Row>
      </div>
    </Modal>
  );
};

UploadDetailsModal.propTypes = {
  sampleName: PropTypes.string,
  fileName: PropTypes.string,
  pathTo: PropTypes.string,
  status: PropTypes.object,
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

UploadDetailsModal.defaultProps = {
  sampleName: '',
  fileName: '',
  pathTo: '',
  status: null,
  visible: true,
  onUpload: null,
  onCancel: null,
};

export default UploadDetailsModal;
