/* eslint-disable import/no-duplicates */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Modal, Button, Col, Row, Progress,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import UploadStatus, { messageForStatus } from 'utils/upload/UploadStatus';

dayjs.extend(utc);

const UploadDetailsModal = (props) => {
  const {
    visible, onCancel, file, extraFields, onUpload, onDownload, onRetry,
  } = props;

  const {
    name, upload, size, lastModified, fileObject = undefined,
  } = file ?? {};
  const { progress, status } = upload ?? false;
  const inputFileRef = useRef(null);
  const [replacementFileObject, setReplacementFileObject] = useState(null);

  useEffect(() => {
    if (replacementFileObject) {
      onUpload(replacementFileObject);
    }
  }, [replacementFileObject]);

  const isSuccessModal = status === UploadStatus.UPLOADED;
  const isNotUploadedModal = status === UploadStatus.FILE_NOT_FOUND;

  function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return `${bytes} ${sizes[i]}`;
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
  }

  const fromISODateToFormatted = (ISOStringDate) => {
    const date = dayjs(ISOStringDate);

    const weekDayName = date.format('dddd');

    const fullDate = date.local().format('DD MMM YYYY');
    const fullTime = date.local().format('HH:mm');

    return `${weekDayName}, ${fullDate} at ${fullTime}`;
  };

  const retryButton = () => (
    <Button
      type='primary'
      key='retry'
      disabled={!fileObject}
      block
      onClick={() => {
        onRetry();
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
            setReplacementFileObject(newFile);
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

  const renderFields = (fields) => (
    Object.keys(fields).map((key) => (
      <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
        <Col span={5}>{key}</Col>
        <Col span={10}>{fields[key]}</Col>
      </Row>
    )));

  return (
    <Modal
      title={!isNotUploadedModal ? (isSuccessModal ? 'Upload successful' : 'Upload error') : 'File not found'}
      open={visible}
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
        {renderFields(extraFields)}

        {!isNotUploadedModal && renderFields({ Filename: name })}

        {
          isSuccessModal ? renderFields({ 'File size': bytesToSize(size), 'Upload date': fromISODateToFormatted(lastModified) })
            : renderFields({ Error: messageForStatus(status) })
        }

        {progress ? renderFields({ Progress: <Progress style={{ width: '100%' }} percent={progress} size='small' /> })
          : <div />}
      </div>
    </Modal>
  );
};

UploadDetailsModal.propTypes = {
  visible: PropTypes.bool,
  onCancel: PropTypes.func,
  file: PropTypes.object.isRequired,
  extraFields: PropTypes.object,
  onDownload: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};

UploadDetailsModal.defaultProps = {
  visible: true,
  extraFields: {},
  onCancel: () => { },
};

export default UploadDetailsModal;
