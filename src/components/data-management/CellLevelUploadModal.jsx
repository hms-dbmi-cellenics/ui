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
} from 'antd';
import { CheckCircleTwoTone, DeleteOutlined } from '@ant-design/icons';
import Dropzone from 'react-dropzone';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import readFileToString from 'utils/upload/readFileToString';

const { Text, Title, Paragraph } = Typography;

const CellLevelUploadModal = (props) => {
  const { onUpload, onCancel, uploading } = props;

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
    const columnNames = data.trim().split('\n')[0].trim().split('\t');
    const hasMetadataColumns = columnNames.some((name) => !['barcode', 'sample'].includes(name));

    if (!columnNames.includes('barcode')) {
      handleError('error', endUserMessages.ERROR_CELL_LEVEL_COLUMN);
      return;
    }
    if (!hasMetadataColumns) {
      handleError('error', 'The selected file has no metadata columns.');
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

  const fileFormatData = [
    [<b>barcode</b>, <b>samples</b>, <b>var1</b>, <b>var2</b>],
    ['barcode-1', 'sample_1', 'value_a', 'value_x'],
    ['barcode-2', 'sample_1', 'value_a', 'value_y'],
    ['barcode-3', 'sample_2', 'value_b', 'value_z'],
  ];

  const exampleData = [
    [<b>barcode</b>, <b>samples</b>, <b>cell_lineage</b>, <b>cell_type</b>],
    ['ACTACT', 'Acute', 'Lymphoid', 'B-Cell'],
    ['GCATGC', 'Convalescent', 'Lymphoid', 'CD8_T-Cell'],
    ['GATCGA', 'Acute', 'Myeloid', 'Monocyte'],
  ];
  return (
    <Modal
      title=''
      visible
      onCancel={onCancel}
      width='50%'
      footer={(
        <Button
          type='primary'
          key='create'
          block
          loading={uploading}
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
            File Upload:
            <span style={{ color: 'red', marginRight: '2em' }}>*</span>
          </Title>
          <Paragraph>
            Upload a single file, containing the cell-level metadata in a tab-separated format (.tsv) file.
            Column
            {' '}
            <b>barcode</b>
            {' '}
            is mandatory,
            {' '}
            <b>sample</b>
            {' '}
            is preferred for de-duplication if required.
          </Paragraph>
          <List
            dataSource={fileFormatData}
            size='small'
            itemLayout='vertical'
            bordered
            renderItem={(item) => (
              <List.Item>
                {item.map((value) => (
                  <span key={value}>
                    <Text code>{value}</Text>
                  </span>
                ))}
              </List.Item>
            )}
          />
        </Col>
      </Row>

      <Row style={{ margin: '1rem 0' }}>
        <Col span={24}>
          <Paragraph>
            For example if you have two samples,
            {' '}
            <b>Acute</b>
            {' '}
            and
            {' '}
            <b>Convalescent</b>
            {' '}
            and you want to add cell-type annotation, you would write a file as follows:
          </Paragraph>
          <List
            dataSource={exampleData}
            size='small'
            itemLayout='vertical'
            bordered
            renderItem={(item) => (
              <List.Item>
                {item.map((value) => (
                  <span key={value}>
                    <Text code>{value}</Text>
                  </span>
                ))}
              </List.Item>
            )}
          />
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

CellLevelUploadModal.propTypes = {
  uploading: PropTypes.bool.isRequired,
  onUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CellLevelUploadModal;
