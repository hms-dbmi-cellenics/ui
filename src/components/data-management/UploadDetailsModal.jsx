import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Modal, Button, Col, Row,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import UploadStatus from '../../utils/UploadStatus';

const UploadDetailsModal = (props) => {
  const {
    sampleName, file, visible, onUpload, onCancel,
  } = props;

  const {
    name: fileName = null, upload = {}, bundle = {},
  } = file;

  const status = upload?.status;
  const bundleName = bundle?.name;

  const inputFileRef = useRef(null);
  const [replacementFileBundle, setReplacementFileBundle] = useState(null);

  useEffect(() => {
    if (replacementFileBundle) {
      onUpload(replacementFileBundle);
    }
  }, [replacementFileBundle]);

  const isSuccessModal = status === UploadStatus.UPLOADED;

  const toMBytes = (sizeInBytes) => (sizeInBytes / (1000 * 1000)).toFixed(2);

  return (
    <Modal
      title={isSuccessModal ? 'Upload successful' : 'Upload error'}
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
                onUpload(bundle);
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
        {!isSuccessModal
          && (
            <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
              The following file has failed to upload
            </Row>
          )}
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
          <Col span={10}>{bundleName}</Col>
        </Row>

        {
          isSuccessModal ? (
            <>
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>File size</Col>
                <Col span={10}>
                  {toMBytes(bundle.size)}
                  {' '}
                  MB
                </Col>
              </Row>
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>Upload date</Col>
                <Col span={10}>NOT IMPLEMENTED YET</Col>
              </Row>
            </>
          )
            : (
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>Error</Col>
                <Col span={10}>{status?.message()}</Col>
              </Row>
            )
        }
      </div>
    </Modal>
  );
};

UploadDetailsModal.propTypes = {
  sampleName: PropTypes.string,
  file: PropTypes.object,
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

UploadDetailsModal.defaultProps = {
  sampleName: '',
  file: {},
  visible: true,
  onUpload: null,
  onCancel: null,
};

export default UploadDetailsModal;
