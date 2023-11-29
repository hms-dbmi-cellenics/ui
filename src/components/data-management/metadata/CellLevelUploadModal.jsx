/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
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
import { useSelector, useDispatch } from 'react-redux';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import readFileToString from 'utils/upload/readFileToString';
import UploadDetailsModal from 'components/data-management/UploadDetailsModal';
import downloadCellLevelMeta from 'utils/data-management/downloadCellLevelMeta';
import { deleteCellLevelMetadata } from 'redux/actions/experiments/index';

const { Text, Title, Paragraph } = Typography;

const CellLevelUploadModal = (props) => {
  const dispatch = useDispatch();
  const {
    onUpload, onCancel, uploading, cellLevelMetadata,
  } = props;

  const [file, setFile] = useState(false);
  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const onUploadFile = async (newFile) => {
    const fileObject = await onUpload(newFile);
    setFile(fileObject);
  };
  const onDrop = async (droppedFiles) => {
    const droppedFile = droppedFiles[0];
    if (!droppedFile.name.endsWith('.tsv')) {
      handleError('error', endUserMessages.ERROR_METADATA_MULTIPLE_FILES);
      return;
    }

    const data = await readFileToString(droppedFile);

    if (!data.trim().split('\n')[0].trim().split('\t').includes('barcode')) {
      handleError('error', endUserMessages.ERROR_CELL_LEVEL_COLUMN);
      return;
    }
    setFile(droppedFile);
  };

  const downloadData = () => {
    downloadCellLevelMeta(activeExperimentId, cellLevelMetadata.name, cellLevelMetadata.id);
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

  const newUploadModal = () => (
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
          loading={uploading}
          disabled={!file}
          onClick={() => {
            onUploadFile(file);
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
          {file ? (
            <>
              <Divider orientation='center'>To upload</Divider>
              <List
                size='small'
                itemLayout='horizontal'
                grid='{column: 4}'
              >
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
                    <DeleteOutlined style={{ color: 'crimson' }} onClick={() => { setFile(false); }} />
                  </Space>
                </List.Item>
              </List>
            </>
          ) : ''}
        </Col>
      </Row>
    </Modal>
  );

  if (Object.keys(cellLevelMetadata).length) {
    const {
      name, size, uploadStatus, percentProgress, createdAt,
    } = cellLevelMetadata;

    const fileInfoObject = {
      name,
      upload: {
        status: uploadStatus,
        progress: percentProgress,
      },
      size,
      fileObject: file.fileObject,
      lastModified: createdAt,
    };
    return (
      <UploadDetailsModal
        onCancel={onCancel}
        onUpload={onUploadFile}
        onDownload={downloadData}
        onDelete={() => dispatch(deleteCellLevelMetadata(activeExperimentId))}
        onRetry={() => onUploadFile(file)}
        data={fileInfoObject}
      />
    );
  }
  return newUploadModal();
};
CellLevelUploadModal.defaultProps = {
  cellLevelMetadata: false,
};
CellLevelUploadModal.propTypes = {
  uploading: PropTypes.bool.isRequired,
  onUpload: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  cellLevelMetadata: PropTypes.object,
};

export default CellLevelUploadModal;
