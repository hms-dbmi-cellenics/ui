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

    if (!data.trim().split('\n')[0].trim().split('\t').includes('barcode')) {
      handleError('error', endUserMessages.ERROR_CELL_LEVEL_COLUMN);
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
            Tab-separated value file, with one row per barcode, containing the following columns:
            <br />
            <Text code> barcode (mandatory) </Text>
            <br />
            <Text code>samples (preferred): </Text>
            {' '}
            values should match sample names in the Data Management module
            <br />
            <b>Other cell-level metadata columns</b>
            <br />
            <br />

            If there were duplicated barcodes, Cellenics will automatically attempt to de-duplicate them using the “samples” column if present.
            If not, duplicated barcodes will be added to a “duplicated” cellset for manual annotation.

            Only one tsv file is allowed per experiment. Uploading a new one will replace any previously existing cell-level metadata.

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
