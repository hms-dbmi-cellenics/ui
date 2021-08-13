import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

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
import techOptions from '../../utils/fileUploadSpecifications';
import UploadStatus from '../../utils/UploadStatus';
import pushNotificationMessage from '../../utils/pushNotificationMessage';
import { inspectFile, VERDICT } from '../../utils/fileInspector';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const FileUploadModal = (props) => {
  const { visible, onUpload, onCancel } = props;

  const guidanceFileLink = 'https://drive.google.com/file/d/1VPaB-yofuExinY2pXyGEEx-w39_OPubO/view';

  const [selectedTech, setSelectedTech] = useState('10X Chromium');
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    setCanUpload(filesList.length && filesList.every((file) => file.valid));
  }, [filesList]);

  // Handle on Drop
  const onDrop = async (acceptedFiles) => {
    const newList = [];
    let filesNotInFolder = false;
    const filteredFiles = acceptedFiles
      // Remove all hidden files
      .filter((file) => !file.name.startsWith('.') && !file.name.startsWith('__MACOSX'))
      // Remove all files that aren't in a folder
      .filter((file) => {
        const inFolder = file.path.includes('/');

        filesNotInFolder ||= !inFolder;

        return inFolder;
      });

    if (filesNotInFolder) {
      pushNotificationMessage('error', 'Only files contained in folder are accepted');
    }

    await Promise.all(filteredFiles.map(async (file) => {
      const error = [];
      // First character of file.path === '/' means a directory is uploaded
      // Remove initial slash so that it does not create an empty directory in S3
      const paths = file.path.split('/');
      const fileName = `${paths[paths.length - 2]}/${paths[paths.length - 1]}`;

      const verdict = inspectFile(file, selectedTech);

      if (verdict === VERDICT.INVALID_NAME) {
        error.push('Invalid file name.');
      } else if (verdict === VERDICT.INVALID_FORMAT) {
        error.push('Invalid file format.')
      }

      newList.push({
        name: fileName,
        bundle: file,
        upload: {
          status: UploadStatus.UPLOADING,
          progress: 0,
        },
        valid: error.length === 0,
        errors: error.join(', '),
        compressed: verdict === VERDICT.VALID_ZIPPED,
      });
    }));

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
              <Select
                defaultValue={selectedTech}
                onChange={(value) => setSelectedTech(value)}
              >
                {Object.keys(techOptions).map((val, idx) => (
                  <Option key={`key-${idx}`} value={val}>{val}</Option>
                ))}
              </Select>
            </Space>
            <Text type='secondary'><i>Only 10x Chromium datasets are currently supported</i></Text>
          </Space>
        </Col>

        {selectedTech && renderHelpText()}

        {/* eslint-disable react/jsx-props-no-spreading */}
        <Col span={24}>
          <Dropzone onDrop={onDrop} multiple>
            {({ getRootProps, getInputProps }) => (
              <div style={{ border: '1px solid #ccc', padding: '2rem 0' }} {...getRootProps({ className: 'dropzone' })} id='dropzone'>
                <input {...getInputProps()} webkitdirectory='' />
                <Empty description='Drag and drop folders here or click to browse.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Dropzone>
        </Col>
        {/* eslint-enable react/jsx-props-no-spreading */}

        {filesList.length ? (
          <>
            <Divider orientation='center'>To upload</Divider>
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

FileUploadModal.propTypes = {
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

FileUploadModal.defaultProps = {
  visible: true,
  onUpload: null,
  onCancel: null,
};

export default FileUploadModal;
