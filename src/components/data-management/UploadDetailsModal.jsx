import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Modal, Button, Col, Row,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import { useDispatch } from 'react-redux';
import pushNotificationMessage from '../../redux/actions/notifications';
import UploadStatus, { messageForStatus } from '../../utils/UploadStatus';

const acceptedFileNamesByCategory = {
  genes: ['features.tsv', 'features.tsv.gz', 'genes.tsv', 'genes.tsv.gz'],
  barcodes: ['barcodes.tsv', 'barcodes.tsv.gz'],
  matrix: ['matrix.mtx', 'matrix.mtx.gz'],
};

const UploadDetailsModal = (props) => {
  const {
    sampleName, file, visible, fileCategory, onUpload, onDownload, onCancel,
  } = props;

  const {
    upload = {}, bundle = {},
  } = file;

  const status = upload?.status;
  const bundleName = bundle?.name;

  const dispatch = useDispatch();

  const inputFileRef = useRef(null);
  const [replacementFileBundle, setReplacementFileBundle] = useState(null);

  useEffect(() => {
    if (replacementFileBundle) {
      onUpload(replacementFileBundle);
    }
  }, [replacementFileBundle]);

  const isSuccessModal = status === UploadStatus.UPLOADED;

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
            const acceptedFileNames = acceptedFileNamesByCategory[fileCategory];
            const newFile = event.target.files[0];

            if (!newFile) {
              return;
            }

            if (acceptedFileNames.includes(newFile.name)) {
              setReplacementFileBundle(newFile);
            } else {
              dispatch(pushNotificationMessage('error', 'The selected file name does not match the expected category.', 2));
            }
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
      title={isSuccessModal ? 'Upload successful' : 'Upload error'}
      visible={visible}
      onCancel={onCancel}
      width='40%'
      footer={(
        <Row style={{ width: '100%', justifyContent: 'center' }}>
          <Col>
            {isSuccessModal ? downloadButton() : retryButton()}
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
              The following file has failed to upload
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
