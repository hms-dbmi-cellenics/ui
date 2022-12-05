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
  Tooltip,
} from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, DeleteOutlined } from '@ant-design/icons';
import Dropzone from 'react-dropzone';
import { useSelector } from 'react-redux';

import config from 'config';
import techOptions from 'utils/upload/fileUploadSpecifications';
import handleError from 'utils/http/handleError';
import { fileObjectToFileRecord } from 'utils/upload/processUpload';
import integrationTestConstants from 'utils/integrationTestConstants';
import endUserMessages from 'utils/endUserMessages';
import { techTypes } from 'utils/constants';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// allow at most 15 GiB .rds object uploads
const SEURAT_MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024;

const FileUploadModal = (props) => {
  const { onUpload, onCancel, previousDataTechnology } = props;

  const samples = useSelector((state) => state.samples);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const previouslyUploadedSamples = Object.keys(samples)
    .filter((key) => samples[key].experimentId === activeExperimentId);

  const guidanceFileLink = 'https://drive.google.com/file/d/1VPaB-yofuExinY2pXyGEEx-w39_OPubO/view';

  const [selectedTech, setSelectedTech] = useState(previousDataTechnology ?? techTypes.CHROMIUM);
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    setCanUpload(filesList.length && filesList.every((file) => file.valid));
  }, [filesList]);

  useEffect(() => {
    setFilesList([]);
  }, [selectedTech]);

  // Handle on Drop
  const onDrop = async (acceptedFiles) => {
    // Remove all hidden files
    let filteredFiles = acceptedFiles
      .filter((file) => !file.name.startsWith('.') && !file.name.startsWith('__MACOSX'));

    if (selectedTech === techTypes.CHROMIUM) {
      let filesNotInFolder = false;

      // Remove all files that aren't in a folder
      filteredFiles = filteredFiles
        .filter((file) => {
          const inFolder = file.path.includes('/');

          filesNotInFolder ||= !inFolder;

          return inFolder;
        });

      if (filesNotInFolder) {
        handleError('error', endUserMessages.ERROR_FILES_FOLDER);
      }

      const newFiles = await Promise.all(filteredFiles.map((file) => (
        fileObjectToFileRecord(file, selectedTech)
      )));

      setFilesList([...filesList, ...newFiles]);
    } else if (selectedTech === techTypes.SEURAT) {
      const newFiles = await Promise.all(filteredFiles.map((file) => (
        fileObjectToFileRecord(file, selectedTech)
      )));

      if (previouslyUploadedSamples.length) {
        handleError('error', endUserMessages.ERROR_SEURAT_EXISTING_FILE);
        return;
      }

      const allFiles = [...filesList, ...newFiles];
      if (allFiles.length > 1) {
        handleError('error', endUserMessages.ERROR_SEURAT_MULTIPLE_FILES);
      }

      const seuratFile = allFiles[0];
      if (seuratFile.size > SEURAT_MAX_FILE_SIZE) {
        handleError('error', endUserMessages.ERROR_SEURAT_MAX_FILE_SIZE);
        return;
      }

      setFilesList([seuratFile]);
    }
  };

  const removeFile = (fileName) => {
    const newArray = _.cloneDeep(filesList);

    const fileIdx = newArray.findIndex((file) => file.name === fileName);
    newArray.splice(fileIdx, 1);
    setFilesList(newArray);
  };

  const { fileUploadParagraphs, dropzoneText, webkitdirectory } = techOptions[selectedTech];

  const renderHelpText = () => (
    <>
      <Space direction='vertical' style={{ width: '100%' }}>
        {
          fileUploadParagraphs.map((text) => (
            <Paragraph key={text}>
              <div dangerouslySetInnerHTML={{ __html: text }} />
            </Paragraph>
          ))
        }
        <List
          dataSource={techOptions[selectedTech].inputInfo}
          size='small'
          itemLayout='vertical'
          bordered
          renderItem={(item) => (
            <List.Item>
              {
                item.map((fileName) => (
                  <span key={fileName} className='ant-typography' dangerouslySetInnerHTML={{ __html: item }} />
                ))
              }
            </List.Item>
          )}
        />
      </Space>
    </>
  );

  return (
    <Modal
      title=''
      visible
      onCancel={onCancel}
      width='50%'
      footer={(
        <Button
          data-test-id={integrationTestConstants.ids.FILE_UPLOAD_BUTTON}
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
              <Tooltip
                title={previousDataTechnology
                  && 'Remove existing data or create a new project to change technology.'}
                placement='bottom'
              >
                <Select
                  defaultValue={selectedTech}
                  onChange={(value) => setSelectedTech(value)}
                  disabled={Boolean(previousDataTechnology)}
                  data-testid='uploadTechSelect'
                >
                  {Object.keys(techOptions).map((val) => (
                    <Option key={`key-${val}`} value={val}>{val}</Option>
                  ))}
                </Select>
              </Tooltip>
            </Space>
            <Text type='secondary'>
              <i>
                Is your dataset generated using another single cell RNA-seq technology (e.g. Nadia, BD Rhapsody, etc.)? Email us to find out if we can support your data:
                <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
              </i>
            </Text>
          </Space>
        </Col>
      </Row>

      <Row style={{ margin: '1rem 0' }}>
        <Col span={24}>
          <Title level={4}>
            File Upload:
            <span style={{ color: 'red', marginRight: '2em' }}>*</span>
          </Title>
          {selectedTech && renderHelpText(selectedTech)}
        </Col>
      </Row>

      <Row>
        {/* eslint-disable react/jsx-props-no-spreading */}
        <Col span={24}>
          <Paragraph type='secondary'>
            <i>
              Don’t have the data in the accepted format? Email us for help with file conversion (e.g. from Fastq or H5 file):
              <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
            </i>
            <span style={{ display: 'block', height: '0.6rem' }} />
            <i>
              More guidance on supported file types and formats is available
              <a rel='noreferrer' target='_blank' href={guidanceFileLink}> here</a>
              .
            </i>
          </Paragraph>
          <Dropzone onDrop={onDrop} multiple>
            {({ getRootProps, getInputProps }) => (
              <div
                data-test-id={integrationTestConstants.ids.FILE_UPLOAD_DROPZONE}
                style={{ border: '1px solid #ccc', padding: '2rem 0' }}
                {...getRootProps({ className: 'dropzone' })}
                id='dropzone'
              >
                <input data-test-id={integrationTestConstants.ids.FILE_UPLOAD_INPUT} {...getInputProps()} webkitdirectory={webkitdirectory} />
                <Empty description={dropzoneText} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Dropzone>
        </Col>
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
                    {file.valid
                      ? (
                        <>
                          <CheckCircleTwoTone twoToneColor='#52c41a' />
                        </>
                      ) : (
                        <>
                          <CloseCircleTwoTone twoToneColor='#f5222d' />
                        </>
                      )}
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
      </Row>
    </Modal>

  );
};

FileUploadModal.propTypes = {
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

FileUploadModal.defaultProps = {
  onUpload: null,
  onCancel: null,
};

export default FileUploadModal;
