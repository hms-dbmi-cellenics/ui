import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
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
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import _ from 'lodash';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const NewProjectModal = (props) => {
  const { visible, onCreate, onCancel } = props;

  const initialSelected = '10X Chromium';
  const [selectedTech, useSelectedTech] = useState(initialSelected);
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  const techOptions = {
    '10X Chromium': {
      acceptedFiles: [
        'barcodes.tsv',
        'barcodes.tsv.gz',
        'features.tsv',
        'features.tsv.gz',
        'matrix.mtx',
        'matrix.mtx.gz',
      ],
      validMimeTypes: ['text/tsv', 'application/gzip'],
      inputInfo: [
        'barcodes.tsv or barcodes.tsv.gz',
        'features.tsv or features.tsv.gz',
        'matrix.mtx or matrix.mtx.gz',
      ],
    },
  };

  // Handle on Drop
  const onDrop = (acceptedFiles) => {
    const newList = [];

    const acceptedFilesRegexp = `(${techOptions[selectedTech].acceptedFiles.join('|')})$`;

    acceptedFiles.forEach((file) => {
      let fileName = null;

      // First character of file.path === '/' means a directory is uploaded
      // Remove initial slash so that it does not create an empty directory in S3
      if (file.path[0] === '/') {
        const paths = file.path.split('/');
        const acceptedExtensions = new RegExp(acceptedFilesRegexp, 'gi');
        fileName = `${paths[paths.length - 2]}/${paths[paths.length - 1].match(acceptedExtensions)}`;
      } else {
        fileName = file.path;
      }

      console.log(file.type);
      const isValidMime = techOptions[selectedTech].validMimeTypes.includes(file.type);

      newList.push({
        name: fileName,
        valid: isValidMime,
      });
      // Upload to AWS Amplify
      // Storage.put(filePath, file)
      //   .then((result) => console.log(result))
      //   .catch((err) => console.log(err));
    });

    setFilesList([...filesList, ...newList]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Modal
      title=''
      visible={visible}
      onCancel={() => { }}
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={!canUpload}
          onClick={() => { }}
        >
          Upload
        </Button>
      )}
      width='80%'
    >
      <Space direction='vertical' style={{ width: '100%' }}>
        <Space align='baseline'>
          <Title level={4} style={{ display: 'inline-block' }}>
            Technology:
            <span style={{ color: 'red', marginRight: '2em' }}>*</span>
          </Title>
          <Select style={{ width: 250 }}>
            {Object.keys(techOptions).map((val, idx) => (
              <Option key={idx} value={val}>{val}</Option>
            ))}
          </Select>
          <Text type='secondary'><i>Only 10x Chromium datasets is currently supported</i></Text>
        </Space>
        {
          selectedTech ? (

            <Row style={{ margin: '1em 0' }}>
              <Col span={24} style={{ textAlign: 'center' }}>
                <Paragraph>For each sample, drag and drop a folder containing the following the following files:</Paragraph>
              </Col>
              <Col span={24} style={{ textAlign: 'center' }}>
                <List
                  dataSource={techOptions[selectedTech].inputInfo}
                  renderItem={(item) => (
                    <Paragraph style={{ margin: 0 }}>
                      &bull;
                      {' '}
                      {item}
                    </Paragraph>
                  )}
                />
              </Col>
              <Col span={24} style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Paragraph>The sample will be named using the folder name</Paragraph>
              </Col>
            </Row>
          ) : ''
        }
        <Row>
          <Col span={24}>
            <div style={{ border: '1px solid #ccc', padding: '2rem 0' }} {...getRootProps({ className: 'dropzone' })} id='dropzone'>
              <input {...getInputProps()} />
              <Empty description='Drag and drop files / folders here' image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          </Col>
        </Row>

        {filesList.length ? (
          <>
            <Divider orientation='center'>Uploaded file</Divider>
            <Row>
              <Col span={6}>
                <List
                  size='small'
                  dataSource={filesList}
                  renderItem={(file) => (
                    <List.Item key={`files-${file}`}>
                      <Text>
                        <Space>
                          {file.valid
                            ? (
                              <CheckCircleTwoTone twoToneColor='#52c41a' />
                            ) : (
                              <CloseCircleTwoTone twoToneColor='#f5222d' />
                            )}
                          {file.name}
                        </Space>
                      </Text>
                    </List.Item>
                  )}
                />
              </Col>
            </Row>
          </>
        ) : ''}
      </Space>
    </Modal>

  );
};

NewProjectModal.propTypes = {
  visible: PropTypes.bool,
  onCreate: PropTypes.func,
  onCancel: PropTypes.func,
};

NewProjectModal.defaultProps = {
  visible: true,
  onCreate: null,
  onCancel: null,
};

export default NewProjectModal;
