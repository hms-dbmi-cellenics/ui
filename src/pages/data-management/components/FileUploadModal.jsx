import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import mime from 'mime-types';
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

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const NewProjectModal = (props) => {
  const { visible, onUpload, onCancel } = props;

  const guidanceFileLink = 'https://drive.google.com/file/d/1qX6no9od4pi-Wy87Q06hmjnLNECwItKJ/view?usp=sharing';

  const [selectedTech, useSelectedTech] = useState('10X Chromium');
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
      validMimeTypes: ['text/tsv', 'application/gzip'],
      inputInfo: [
        'features.tsv/features.tsv.gz or genes.tsv/genes.tsv.gz',
        'barcodes.tsv/barcodes.tsv.gz',
        'matrix.mtx/matrix.mtx.gz',
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

      const isValidMime = techOptions[selectedTech].validMimeTypes.includes(mime.lookup(file.path));
      if (!isValidMime) error.push('invalid mime types');

      const acceptedFilenames = new RegExp(acceptedFilesRegexp, 'gi');
      const isValidFilename = fileName.match(acceptedFilenames) || false;
      if (!isValidFilename) error.push('invalid file name');

      newList.push({
        name: fileName,
        valid: isValidMime && isValidFilename,
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

  return (
    <Modal
      title=''
      visible={visible}
      onCancel={onCancel}
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={!canUpload}
          onClick={() => {
            onUpload();
            setFilesList([]);
          }}
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
          <Select style={{ width: 250 }} defaultValue={selectedTech}>
            {Object.keys(techOptions).map((val, idx) => (
              <Option key={idx} value={val}>{val}</Option>
            ))}
          </Select>
          <Text type='secondary'><i>Only 10x Chromium datasets are currently supported</i></Text>
        </Space>
        {
          selectedTech ? (

            <Row style={{ margin: '1em 0' }}>
              <Col span={24} style={{ textAlign: 'center' }}>
                <Paragraph>
                  {`For each sample, the following ${techOptions[selectedTech].inputInfo.length} files are required:`}
                </Paragraph>
              </Col>
              <Col span={24} style={{ textAlign: 'center' }}>
                <List
                  dataSource={techOptions[selectedTech].inputInfo}
                  renderItem={(item) => (
                    <Paragraph style={{ margin: 0 }}>
                      &bull;
                      {` ${item}`}
                    </Paragraph>
                  )}
                />
              </Col>
              <Col span={24} style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Paragraph>{`Drag and drop the folder containing these ${techOptions[selectedTech].inputInfo.length} files. The folder should be named with the sample ID.`}</Paragraph>
                <Paragraph>
                  Further guidance on supported file types and formats is available
                  {' '}
                  <a rel='noreferrer' target='_blank' href={guidanceFileLink}>here</a>
                  .
                </Paragraph>
              </Col>
            </Row>
          ) : ''
        }
        <Row>
          <Col span={24}>
            <Dropzone onDrop={onDrop}>
              {({ getRootProps, getInputProps }) => (
                <div style={{ border: '1px solid #ccc', padding: '2rem 0' }} {...getRootProps({ className: 'dropzone' })} id='dropzone'>
                  <input {...getInputProps()} />
                  <Empty description='Drag and drop folders here' image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </Dropzone>
          </Col>
        </Row>

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
      </Space>
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
