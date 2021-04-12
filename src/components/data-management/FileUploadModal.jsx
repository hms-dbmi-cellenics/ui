import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import mime from 'mime-types';
import path from 'path';

import {
  Modal,
  Button,
  Typography,
  Select,
  Space,
  Row,
  Col,
  Empty,
  Divider,
  List,
} from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, DeleteOutlined } from '@ant-design/icons';
import Dropzone from 'react-dropzone';

import UploadStatus from '../../utils/UploadStatus';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const NewProjectModal = (props) => {
  const { visible, onUpload, onCancel } = props;

  const guidanceFileLink = 'https://drive.google.com/file/d/1qX6no9od4pi-Wy87Q06hmjnLNECwItKJ/view?usp=sharing';

  const [selectedTech, setSelectedTech] = useState('10X Chromium');
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  const techOptions = {
    '10X Chromium': {
      acceptedFiles: [
        'barcodes.tsv',
        'barcodes.tsv.gz',
        'features.tsv',
        'features.tsv.gz',
        'genes.tsv',
        'genes.tsv.gz',
        'matrix.mtx',
        'matrix.mtx.gz',
      ],
      validMimeTypes: ['text/tsv', 'application/gzip', 'text/tab-separated-values'],
      validExtensionTypes: ['.mtx'],
      inputInfo: [
        ['features.tsv', 'features.tsv.gz', 'genes.tsv', 'genes.tsv.gz'],
        ['barcodes.tsv', 'barcodes.tsv.gz'],
        ['matrix.mtx', 'matrix.mtx.gz'],
      ],
    },
  };

  useEffect(() => {
    setCanUpload(filesList.length && filesList.every((file) => file.valid));
  }, [filesList]);

  // Handle on Drop
  const onDrop = (acceptedFiles) => {
    const newList = [];

    const acceptedFilesRegexp = `(${techOptions[selectedTech].acceptedFiles.join('|')})$`;

    acceptedFiles.forEach((file) => {
      let fileName = null;
      const error = [];

      // First character of file.path === '/' means a directory is uploaded
      // Remove initial slash so that it does not create an empty directory in S3
      if (file.path[0] === '/') {
        const paths = file.path.split('/');
        fileName = `${paths[paths.length - 2]}/${paths[paths.length - 1]}`;
      } else {
        fileName = file.path;
      }

      const isValidType = (
        techOptions[selectedTech].validMimeTypes
          .includes(
            mime.lookup(file.path),
          )
        || techOptions[selectedTech].validExtensionTypes
          .includes(
            path.extname(file.path),
          )
      );

      if (!isValidType) error.push('Invalid file type.');

      const acceptedFilenames = new RegExp(acceptedFilesRegexp, 'gi');
      const isValidFilename = fileName.match(acceptedFilenames) !== null;
      if (!isValidFilename) error.push('Invalid file name.');

      newList.push({
        name: fileName,
        bundle: file,
        status: UploadStatus.UPLOADING,
        valid: isValidType && isValidFilename,
        errors: error.join(', '),
      });
    });

    setFilesList([...filesList, ...newList]);
  };

  const removeFile = (fileIdx) => {
    const newArray = _.cloneDeep(filesList);

    newArray.splice(fileIdx, 1);
    setFilesList(newArray);
  };

  const renderHelpText = () => (
    <>
      <Col span={24} style={{ padding: '1rem' }}>
        <Paragraph>
          For each sample, upload a folder containing the following
          {' '}
          <Text strong>{techOptions[selectedTech].inputInfo.length}</Text>
          {' '}
          files:
        </Paragraph>
        <List
          dataSource={techOptions[selectedTech].inputInfo}
          size='small'
          itemLayout='vertical'
          bordered
          renderItem={(item) => (
            <List.Item>
              {
                item.map((fileName, i) => (
                  <span key={fileName}>
                    <Text code>{`${fileName}`}</Text>
                    {i !== item.length - 1 && ' or '}
                  </span>
                ))
              }
            </List.Item>
          )}
        />
      </Col>
      <Col span={24} style={{ padding: '1rem' }}>
        <Paragraph>
          The folder&apos;s name will be used to name
          the sample in it. You can change this
          name later in Data Management.
        </Paragraph>
        <Paragraph type='secondary'>
          More guidance on supported file types and formats is available
          {' '}
          <a rel='noreferrer' target='_blank' href={guidanceFileLink}>here</a>
          {' '}
          (opens in new tab).
        </Paragraph>
      </Col>
    </>
  );

  return (
    <Modal
      title=''
      visible={visible}
      onCancel={onCancel}
      width='50%'
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={!canUpload}
          onClick={() => {
            onUpload(filesList, selectedTech);
            setFilesList([]);
          }}
        >
          Upload
        </Button>
      )}
    >
      <Row>
        <Col span={24}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Space align='baseline'>
              <Title level={4} style={{ display: 'inline-block' }}>
                Technology:
                <span style={{ color: 'red', marginRight: '2em' }}>*</span>
              </Title>
              <Select style={{ width: 250 }} defaultValue={selectedTech} onChange={(value) => setSelectedTech(value)}>
                {Object.keys(techOptions).map((val, idx) => (
                  <Option key={idx} value={val}>{val}</Option>
                ))}
              </Select>
            </Space>
            <Text type='secondary'><i>Only 10x Chromium datasets are currently supported</i></Text>
          </Space>
        </Col>

        {selectedTech && renderHelpText()}

        {/* eslint-disable react/jsx-props-no-spreading */}
        <Col span={24}>
          <Dropzone onDrop={onDrop}>
            {({ getRootProps, getInputProps }) => (
              <div style={{ border: '1px solid #ccc', padding: '2rem 0' }} {...getRootProps({ className: 'dropzone' })} id='dropzone'>
                <input {...getInputProps()} />
                <Empty description='Drag and drop folders here or click to browse.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Dropzone>
        </Col>
        {/* eslint-enable react/jsx-props-no-spreading */}

        {filesList.length ? (
          <>
            <Divider orientation='center'>Uploaded files</Divider>
            <ul style={{
              columnCount: 4, listStyleType: 'none', padding: 0, margin: 0,
            }}
            >
              {filesList.map((file, idx) => (
                <li key={`file-${idx}`}>
                  <Space>
                    {file.valid
                      ? (
                        <>
                          <CheckCircleTwoTone twoToneColor='#52c41a' />
                          {file.name}
                        </>
                      ) : (
                        <>
                          <CloseCircleTwoTone twoToneColor='#f5222d' />
                          <span>
                            {`${file.name} - ${file.errors}`}
                          </span>
                        </>
                      )}
                    <DeleteOutlined style={{ color: 'crimson' }} onClick={() => { removeFile(idx); }} />
                  </Space>
                </li>
              ))}
            </ul>
          </>
        ) : ''}
      </Row>
    </Modal>

  );
};

NewProjectModal.propTypes = {
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

NewProjectModal.defaultProps = {
  visible: true,
  onUpload: null,
  onCancel: null,
};

export default NewProjectModal;
