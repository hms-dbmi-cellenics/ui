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
} from 'antd';
import { useDropzone } from 'react-dropzone';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const NewProjectModal = (props) => {
  const { visible, onCreate, onCancel } = props;

  const initialSelected = '10X Chromium';
  const [selectedTech, useSelectedTech] = useState(initialSelected);
  const [canUpload, setCanUpload] = useState(false);

  // Handle on Drop
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      // First character of file.path === '/' means a directory is uploaded
      // Remove initial slash so that it does not create an empty directory in S3
      const filePath = file.path[0] === '/' ? file.path.slice(1) : file.path;

      // Upload to AWS Amplify
      Storage.put(filePath, file)
        .then((result) => console.log(result))
        .catch((err) => console.log(err));
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const techOptions = {
    '10X Chromium': [
      {
        filename: 'barcodes.tsv or barcodes.tsv.gz',
        format: 'Sample_ID.barcodes.tsv or Sample_ID.barcodes.tsv',
      },
      {
        filename: 'features.tsv or features.tsv.gz',
        format: 'Sample_ID.features.tsv or Sample_ID.features.tsv.gz',
      },
      {
        filename: 'matrix.mtx or matrix.mtx.gz',
        format: 'Sample_ID.matrix.mtx or Sample_ID.matrix.mtx.gz',
      },
    ],
  };

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
        <Row style={{ margin: '1em 0' }}>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Paragraph>For each sample, provide the following 3 files using the following filename format:</Paragraph>
          </Col>
          <Col span={12} style={{ textAlign: 'right', paddingRight: '0.5em' }}>
            {
              techOptions[selectedTech].map((s) => <Paragraph>{s.filename}</Paragraph>)
            }
          </Col>
          <Col span={12} style={{ textAlign: 'left', paddingLeft: '0.5em' }}>
            {
              techOptions[selectedTech].map((s) => <Paragraph>{s.format}</Paragraph>)
            }
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <div style={{ border: '1px solid #ccc', padding: '2rem 0' }} {...getRootProps({ className: 'dropzone' })} id='dropzone'>
              <input {...getInputProps()} />
              <Empty description='Drag and drop some files here, or click to select files' image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          </Col>
        </Row>
        <Row>
          <Col />
        </Row>
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
