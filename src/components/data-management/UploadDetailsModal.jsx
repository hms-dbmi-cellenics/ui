import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Modal, Button, Col, Row,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import pushNotificationMessage from '../../utils/pushNotificationMessage';
import UploadStatus, { messageForStatus } from '../../utils/UploadStatus';
import checkIfFileValid from '../../utils/checkIfFileValid';

const UploadDetailsModal = (props) => {
  const {
    sampleName, file, visible, fileCategory, onUpload, onDownload, onCancel,
  } = props;

  const {
    upload = {}, bundle = {},
  } = file;

  const status = upload?.status;
  const bundleName = bundle?.name;

  const inputFileRef = useRef(null);
  const [replacementFileBundle, setReplacementFileBundle] = useState(null);

  useEffect(() => {
    if (replacementFileBundle) {
      // we'll need to remove the hard-coded 10x tech type once we start
      // supporting other types and save the chosen tech type in redux
      const valid = checkIfFileValid(replacementFileBundle.name, '10X Chromium');
      if (valid.isValidFilename && valid.isValidType) {
        onUpload(replacementFileBundle);
      } else {
        pushNotificationMessage('error', 'The selected file name does not match the expected category.', 2);
      }
    }
  }, [replacementFileBundle]);

  const isSuccessModal = status === UploadStatus.UPLOADED;
  const isNotUploadedModal = status === UploadStatus.FILE_NOT_FOUND;

  const toMBytes = (sizeInBytes) => (sizeInBytes / (1000 * 1000)).toFixed(2);

  const fromISODateToFormatted = (ISOStringDate) => {
    const date = moment(ISOStringDate);

    const weekDayName = date.format('dddd');

    const fullDate = date.local().format('DD MMM YYYY');
    const fullTime = date.local().format('HH:mm');

    return `${weekDayName}, ${fullDate} at ${fullTime}`;
  };

  const retryButton = () => (
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
  );

  const replaceButton = () => (
    <>
      <input
        type='file'
        id='file'
        ref={inputFileRef}
        style={{ display: 'none' }}
        onChange={
          (event) => {
            const newFile = event.target.files[0];
            if (!newFile) {
              return;
            }
            setReplacementFileBundle(newFile);
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
        {/* Button text to be "Upload" if the file was never uploaded */}
        {!isNotUploadedModal ? 'Replace file' : 'Upload'}
      </Button>
    </>
  );

  const downloadButton = () => (
    <Button
      type='primary'
      key='retry'
      block
      onClick={() => {
        onDownload();
      }}
      style={{ width: '140px', marginBottom: '10px' }}
    >
      Download
    </Button>
  );

  return (
    <Modal
      title={!isNotUploadedModal ? (isSuccessModal ? 'Upload successful' : 'Upload error') : 'File not found'}
      visible={visible}
      onCancel={onCancel}
      width='40%'
      footer={(
        <Row style={{ width: '100%', justifyContent: 'center' }}>
          <Col>
            {/* render retry button only if file was tried to be uploaded */}
            {!isNotUploadedModal && (isSuccessModal ? downloadButton() : retryButton())}
          </Col>
          <Col span='2' />
          {replaceButton()}
          <Col />
        </Row>
      )}
    >
      <div style={{ width: '100%', marginLeft: '15px' }}>
        {!isSuccessModal
          && (
            <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
              The following file
              {' '}
              {isNotUploadedModal ? 'was not uploaded' : 'has failed to upload'}
            </Row>
          )}
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Sample</Col>
          <Col span={10}>{sampleName}</Col>
        </Row>
        <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
          <Col span={5}>Category</Col>
          <Col span={10}>{fileCategory}</Col>
        </Row>
        {!isNotUploadedModal && (
          <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
            <Col span={5}>Filename</Col>
            <Col span={10}>{bundleName}</Col>
          </Row>
        )}

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
                <Col span={10}>{fromISODateToFormatted(file.lastModified)}</Col>
              </Row>
            </>
          )
            : (
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>Error</Col>
                <Col span={10}>{messageForStatus(status)}</Col>
              </Row>
            )
        }
      </div>
    </Modal>
  );
};

UploadDetailsModal.propTypes = {
  fileCategory: PropTypes.string.isRequired,
  sampleName: PropTypes.string,
  file: PropTypes.object,
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onDownload: PropTypes.func,
  onCancel: PropTypes.func,
};

UploadDetailsModal.defaultProps = {
  sampleName: '',
  file: {},
  visible: true,
  onUpload: () => { },
  onDownload: () => { },
  onCancel: () => { },
};

export default UploadDetailsModal;
