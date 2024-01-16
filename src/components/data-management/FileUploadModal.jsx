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
import { sampleTech } from 'utils/constants';
import fileUploadUtils, { techNamesToDisplay } from 'utils/upload/fileUploadUtils';
import handleError from 'utils/http/handleError';
import { fileObjectToFileRecord } from 'utils/upload/processUpload';
import integrationTestConstants from 'utils/integrationTestConstants';
import endUserMessages from 'utils/endUserMessages';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// allow at most 15 GiB .rds object uploads
const SEURAT_MAX_FILE_SIZE = 15 * 1024 * 1024 * 1024;

const extraHelpText = {
  [sampleTech['10X']]: () => <></>,
  [sampleTech.SEURAT]: () => <></>,
  [sampleTech.H5]: () => <></>,
  [sampleTech.RHAPSODY]: () => (
    <Paragraph>
      <ul>
        <li>
          The zip files that are output by the primary processing pipeline contain
          the .st files that should be uploaded and they must be unzipped first.
        </li>
        <li>
          The folder with Multiplet and Undetermined
          cells should not be uploaded since it would distort the analysis.
        </li>
      </ul>
    </Paragraph>
  ),
  [sampleTech.PARSE]: () => <></>,
};

const FileUploadModal = (props) => {
  const { onUpload, onCancel, currentSelectedTech } = props;

  const samples = useSelector((state) => state.samples);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const previouslyUploadedSamples = Object.keys(samples)
    .filter((key) => samples[key].experimentId === activeExperimentId);

  const guidanceFileLink = 'https://drive.google.com/file/d/1VPaB-yofuExinY2pXyGEEx-w39_OPubO/view';

  const [selectedTech, setSelectedTech] = useState(currentSelectedTech ?? sampleTech['10X']);
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    setCanUpload(filesList.length && filesList.every((file) => !file.errors));
  }, [filesList]);

  useEffect(() => {
    setFilesList([]);
  }, [selectedTech]);

  // Handle on Drop
  const onDrop = async (acceptedFiles) => {
    // Remove all hidden files
    const filteredFiles = acceptedFiles
      .filter((file) => !file.name.startsWith('.') && !file.name.startsWith('__MACOSX'));

    if (selectedTech === sampleTech.SEURAT) {
      // TODO1 this needs to be further refactored before it is moved into
      // fileUploadUtils as a filterFiles call, right now it's a bit unnecessarily complicated
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
    } else {
      const newFiles = await fileUploadUtils[selectedTech].filterFiles(filteredFiles);

      setFilesList([...filesList, ...newFiles]);
    }
  };

  const removeFile = (fileName) => {
    const newArray = _.cloneDeep(filesList);

    const fileIdx = newArray.findIndex((file) => file.name === fileName);
    newArray.splice(fileIdx, 1);
    setFilesList(newArray);
  };

  const { fileUploadParagraphs, dropzoneText, webkitdirectory } = fileUploadUtils[selectedTech];

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
          dataSource={fileUploadUtils[selectedTech].inputInfo}
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
        {extraHelpText[selectedTech]()}
      </Space>
    </>
  );

  return (
    <Modal
      title=''
      open
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
                title={currentSelectedTech
                  && 'Remove existing data or create a new project to change technology.'}
                placement='bottom'
              >
                <Select
                  aria-label='sampleTechnologySelect'
                  data-testid='uploadTechSelect'
                  defaultValue={selectedTech}
                  disabled={currentSelectedTech}
                  onChange={(value) => setSelectedTech(value)}
                  // Fix the width so that the dropdown doesn't change size when the value changes
                  style={{ width: 180 }}
                >
                  {
                    Object.values(sampleTech)
                      .map((tech) => (
                        <Option key={`key-${tech}`} value={tech}>
                          {techNamesToDisplay[tech]}
                        </Option>
                      ))
                  }
                </Select>
              </Tooltip>
            </Space>
            <Text type='secondary'>
              <i>
                Is your dataset generated using another single cell RNA-seq technology (e.g. Nadia, inDrop, etc.)? Email us to find out if we can support your data:
                <a href={`mailto:${config.supportEmail}`}>
                  {' '}
                  {config.supportEmail}
                </a>
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
        </Col>
      </Row>

      <Row>
        {/* eslint-disable react/jsx-props-no-spreading */}
        <Col span={24}>
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
                      {!file.errors
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
                        ellipsis={{ tooltip: fileUploadUtils[selectedTech].getFilePathToDisplay(file.fileObject.path) }}
                        style={{ width: '200px' }}
                      >
                        {fileUploadUtils[selectedTech].getFilePathToDisplay(file.fileObject.path)}
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

FileUploadModal.propTypes = {
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
  currentSelectedTech: PropTypes.string,
};

FileUploadModal.defaultProps = {
  onUpload: null,
  onCancel: null,
  currentSelectedTech: null,
};

export default FileUploadModal;
