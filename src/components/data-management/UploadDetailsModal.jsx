/* eslint-disable import/no-duplicates */
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Modal, Button, Col, Row,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';
import { createAndUploadSingleFile, fileObjectToFileRecord } from 'utils/upload/processUpload';

import UploadStatus, { messageForStatus } from 'utils/upload/UploadStatus';
import downloadSingleFile from 'utils/data-management/downloadSingleFile';

dayjs.extend(utc);

const UploadDetailsModal = (props) => {
  const dispatch = useDispatch();
  const {
    visible, onCancel, file,
  } = props;

  const {
    name, fileCategory, sampleUuid, upload, size, lastModified, fileObject = undefined,
  } = file ?? {};

  const status = upload?.status;
  const inputFileRef = useRef(null);
  const [replacementFileObject, setReplacementFileObject] = useState(null);

  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const samples = useSelector((state) => state.samples);
  const selectedTech = useSelector((state) => state.samples[sampleUuid]?.type);
  const sampleName = samples[file?.sampleUuid]?.name;

  useEffect(() => {
    if (replacementFileObject) {
      fileObjectToFileRecord(replacementFileObject, selectedTech).then((newFile) => {
        if (newFile.valid) {
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
    const date = dayjs(ISOStringDate);

    const weekDayName = date.format('dddd');

    const fullDate = date.local().format('DD MMM YYYY');
    const fullTime = date.local().format('HH:mm');

    return `${weekDayName}, ${fullDate} at ${fullTime}`;
  };

  const uploadFile = (newFile) => {
    if (!file) {
      return;
    }

    createAndUploadSingleFile(newFile, activeExperimentId, sampleUuid, dispatch, selectedTech);
    onCancel();
  };

  const retryButton = () => (
    <Button
      type='primary'
      key='retry'
      disabled={!fileObject}
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
        downloadSingleFile(activeExperimentId, sampleUuid, name);
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
            <Col span={10}>{name}</Col>
          </Row>
        )}

        {
          isSuccessModal ? (
            <>
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>File size</Col>
                <Col span={10}>
                  {toMBytes(size)}
                  {' '}
                  MB
                </Col>
              </Row>
              <Row style={{ marginTop: '5px', marginBottom: '5px' }}>
                <Col span={5}>Upload date</Col>
                <Col span={10}>{fromISODateToFormatted(lastModified)}</Col>
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
  visible: PropTypes.bool,
  onCancel: PropTypes.func,
  file: PropTypes.object.isRequired,
};

UploadDetailsModal.defaultProps = {
  visible: true,
  onCancel: () => { },
};

export default UploadDetailsModal;
