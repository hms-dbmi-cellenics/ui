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

  const fileFormatTable = {
    columns: [
      {
        title: 'barcode',
        dataIndex: 'barcode',
        key: 'barcode',
      },
      {
        title: 'samples',
        dataIndex: 'samples',
        key: 'samples',
      },
      {
        title: 'var1',
        dataIndex: 'var1',
        key: 'var',
      },
      {
        title: 'var2',
        dataIndex: 'var2',
        key: 'var2',
      },
    ],
    dataSource: [
      {
        barcode: 'barcode-1',
        samples: 'sample_1',
        var1: 'value_a',
        var2: 'value_x',
      }, {
        barcode: 'barcode-2',
        samples: 'sample_1',
        var1: 'value_a',
        var2: 'value_y',
      }, {
        barcode: 'barcode-3',
        samples: 'sample_2',
        var1: 'value_b',
        var2: 'value_z',
      },
    ],
  };
  const exampleTable = {
    columns: [
      {
        title: 'barcode',
        dataIndex: 'barcode',
        key: 'barcode',
      },
      {
        title: 'samples',
        dataIndex: 'samples',
        key: 'samples',
      },
      {
        title: 'cell_lineage',
        dataIndex: 'cell_lineage',
        key: 'cell_lineage',
      },
      {
        title: 'cell_type',
        dataIndex: 'cell_type',
        key: 'cell_type',
      },
    ],
    dataSource: [
      {
        barcode: 'ACTACT',
        samples: 'Acute',
        cell_lineage: 'Lymphoid',
        cell_type: 'B-Cell',
      },
      {
        barcode: 'GCATGC',
        samples: 'Convalescent',
        cell_lineage: 'Lymphoid',
        cell_type: 'CD8_T-Cell',
      },
      {
        barcode: 'GATCGA',
        samples: 'Acute',
        cell_lineage: 'Myeloid',
        cell_type: 'Monocyte',
      },
    ],
  };
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
            {' '}
            <br />
            Column
            {' '}
            <b>barcode</b>
            {' '}
            is mandatory,
            {' '}
            <b>sample</b>
            {' '}
            is preferred for de-duplication if required.
            <br />
            <Table size='small' pagination={false} dataSource={fileFormatTable.dataSource} columns={fileFormatTable.columns} />
            {' '}
            <br />
            For example if you have two samples,
            {' '}
            <b>Acute</b>
            {' '}
            and
            {' '}
            <b>Convalescent</b>
            {' '}
            and you want to add cell-type annotation, you would write a file as follows:
            <Table size='small' pagination={false} dataSource={exampleTable.dataSource} columns={exampleTable.columns} />
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

CellLevelUploadModal.propTypes = {
  uploading: PropTypes.bool.isRequired,
  onUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CellLevelUploadModal;
