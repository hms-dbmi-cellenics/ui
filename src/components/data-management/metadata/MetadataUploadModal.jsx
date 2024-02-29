import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Modal,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Empty,
  Divider,
  List,
  Table,
} from 'antd';
import { CheckCircleTwoTone, DeleteOutlined } from '@ant-design/icons';
import Dropzone from 'react-dropzone';

import config from 'config';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import readFileToString from 'utils/upload/readFileToString';
import getDomainSpecificContent from 'utils/getDomainSpecificContent';

const { Text, Title, Paragraph } = Typography;

const formatExample = [
  ['sample_name_1', 'metadata_key_1', 'metadata_value_1'],
  ['sample_name_1', 'metadata_key_2', 'metadata_value_2'],
  ['sample_name_2', 'metadata_key_2', 'metadata_value_3'],
];
const withCodeText = (text) => <Text code>{text}</Text>;
const exampleFile = [
  ['Acute', 'Status', 'Tumor'],
  ['Convalescent', 'Status', 'Normal'],
  ['Convalescent', 'Gender', 'Female'],
];
const formatExampleTable = {
  columns: [
    { dataIndex: 'sample_name' },
    { dataIndex: 'metadata_key' },
    { dataIndex: 'metadata_value' },
  ],
  dataSource: formatExample.map((item) => ({
    sample_name: withCodeText(item[0]),
    metadata_key: withCodeText(item[1]),
    metadata_value: withCodeText(item[2]),
  })),
};

const exampleFileTable = {
  columns: [
    { dataIndex: 'samples' },
    { dataIndex: 'status' },
    { dataIndex: 'gender_or_other' },
  ],
  dataSource: exampleFile.map((item) => ({
    samples: withCodeText(item[0]),
    status: withCodeText(item[1]),
    gender_or_other: withCodeText(item[2]),
  })),
};
const MetadataUploadModal = (props) => {
  const { onUpload, onCancel } = props;

  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    setCanUpload(filesList.length === 1);
  }, [filesList]);

  // Handle on Drop
  const onDrop = async (droppedFiles) => {
    if (droppedFiles.length !== 1 || !droppedFiles[0].name.endsWith('.tsv')) {
      handleError('error', endUserMessages.ERROR_METADATA_MULTIPLE_FILES);
      return;
    }

    const file = droppedFiles[0];
    const data = await readFileToString(file);

    // this line of code is checking if the first line of the file has
    // exactly 3 values when it's split by multiple spaces or tabs
    if (data.trim().split('\n')[0].trim().split('\t').length !== 3) {
      handleError('error', endUserMessages.ERROR_METADATA_WRONG_FORMAT);
      return;
    }

    setFilesList([file]);
  };

  const removeFile = (fileName) => {
    const newArray = _.cloneDeep(filesList);
    const fileIdx = newArray.findIndex((file) => file.name === fileName);
    newArray.splice(fileIdx, 1);
    setFilesList(newArray);
  };

  return (
    <Modal
      title=''
      open
      onCancel={onCancel}
      width='40%'
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={!canUpload}
          onClick={() => {
            onUpload(filesList[0]);
            setFilesList([]);
          }}
        >
          Upload
        </Button>
      )}
    >
      <Row style={{ margin: '1rem 0' }}>
        <Col span={24}>
          <Title level={4}>
            Metadata Upload:
            <span style={{ color: 'red', marginRight: '2em' }}>*</span>
          </Title>
          <Paragraph>
            Upload a single file containing the metadata in key-value tab-separated format (.tsv)
            as follows:
          </Paragraph>
          <Table size='small' showHeader={false} pagination={false} dataSource={formatExampleTable.dataSource} columns={formatExampleTable.columns} />
        </Col>
      </Row>
      <Row style={{ margin: '1rem 0' }}>
        <Col span={24}>
          <Paragraph>
            For example, if you have two samples
            {' '}
            <Text code>Acute</Text>
            {' '}
            and
            {' '}
            <Text code>Convalescent</Text>
            and you want to indicate their status (either
            <Text code>Tumor</Text>
            {' '}
            or
            {' '}
            <Text code>Normal</Text>
            ) and you know that the gender of one is
            {' '}
            <Text code>Female</Text>
            you would write a file as follows:
          </Paragraph>
          <Table size='small' style={{ width: '70%' }} pagination={false} showHeader={false} dataSource={exampleFileTable.dataSource} columns={exampleFileTable.columns} />
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Paragraph type='secondary'>
            <i>
              Don’t have the data in an accepted format?
              {' '}
              {getDomainSpecificContent('helpMessage')}
            </i>
          </Paragraph>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Dropzone data-testid='dropzone' onDrop={onDrop}>
            {({ getRootProps, getInputProps }) => (
              <div
                style={{ border: '1px solid #ccc', padding: '2rem 0' }}
                {...getRootProps({ className: 'dropzone' })}
                id='dropzone'
              >
                <input data-testid='drop-input' {...getInputProps()} />
                <Empty description='Drag and drop the metadata file here or click to browse.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Dropzone>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          {/* eslint-enable react/jsx-props-no-spreading */}

          {filesList.length ? (
            <>
              <Divider orientation='center'>To upload</Divider>
              <List
                dataSource={filesList}
                size='small'
                itemLayout='horizontal'
                grid='{column: 4}'
                renderItem={(file) => (

                  <List.Item
                    key={file.name}
                    style={{ width: '100%' }}
                  >
                    <Space>

                      <CheckCircleTwoTone twoToneColor='#52c41a' />

                      <Text
                        ellipsis={{ tooltip: file.name }}
                        style={{ width: '200px' }}
                      >
                        {file.name}

                      </Text>
                      <DeleteOutlined style={{ color: 'crimson' }} onClick={() => { removeFile(file.name); }} />
                    </Space>
                  </List.Item>

                )}
              />
            </>
          ) : ''}
        </Col>
      </Row>
    </Modal>

  );
};

MetadataUploadModal.propTypes = {
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
  currentSelectedTech: PropTypes.string,
};

MetadataUploadModal.defaultProps = {
  onUpload: null,
  onCancel: null,
  currentSelectedTech: null,
};

export default MetadataUploadModal;
