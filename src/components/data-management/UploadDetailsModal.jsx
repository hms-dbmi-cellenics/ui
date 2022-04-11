/* eslint-disable import/no-duplicates */
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Modal, Button, Col, Row,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';
import { uploadSingleFile, fileObjectToFileRecord } from '../../utils/upload/processUpload';

import UploadStatus, { messageForStatus } from '../../utils/upload/UploadStatus';
import downloadSingleFile from '../../utils/data-management/downloadSingleFile';

// we'll need to remove the hard-coded 10x tech type once we start
// supporting other types and save the chosen tech type in redux
const SELECTED_TECH = '10X Chromium';

const UploadDetailsModal = (props) => {
  const dispatch = useDispatch();
  const {
    visible, onCancel, uploadDetailsModalDataRef,
  } = props;
  const { fileCategory, sampleUuid } = uploadDetailsModalDataRef.current ?? {};
  const file = uploadDetailsModalDataRef.current?.file ?? {};
  const { upload } = file ?? {};
  const status = upload?.status;
  const inputFileRef = useRef(null);
  const [replacementFileObject, setReplacementFileObject] = useState(null);

  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const samples = useSelector((state) => state.samples);
  const sampleName = samples[uploadDetailsModalDataRef.current?.sampleUuid]?.name;

  useEffect(() => {
    if (replacementFileObject) {
      fileObjectToFileRecord(replacementFileObject, SELECTED_TECH).then((newFile) => {
        if (newFile.valid) { // && newFile.name === file.name ?
          uploadFile(newFile);
        } else {
          handleError('error', endUserMessages.ERROR_FILE_CATEGORY);
        }
      });
    }
  }, [replacementFileObject]);

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

  const uploadFile = (newFile) => {
    if (!uploadDetailsModalDataRef.current) {
      return;
    }
    uploadSingleFile(newFile, activeProjectUuid, sampleUuid, dispatch);
    onCancel();
  };

  const retryButton = () => (
    <Button
      type='primary'
      key='retry'
      disabled={!file?.fileObject}
      block
      onClick={() => {
        uploadFile(file);
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
        downloadSingleFile(activeProjectUuid, sampleUuid, file.name);
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
            <Col span={10}>{file.name}</Col>
          </Row>
        )}

        {
          isSuccessModal ? (
            <>
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>File size</Col>
                <Col span={10}>
                  {toMBytes(file.size)}
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
  file: PropTypes.object,
  visible: PropTypes.bool,
  onCancel: PropTypes.func,
  uploadDetailsModalDataRef: PropTypes.object.isRequired,
};

UploadDetailsModal.defaultProps = {
  file: {},
  visible: true,
  onCancel: () => { },
};

export default UploadDetailsModal;
