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
} from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, DeleteOutlined } from '@ant-design/icons';
import Dropzone from 'react-dropzone';

import config from 'config';
import { sampleTech } from 'utils/constants';
import techOptions, { techNamesToDisplay } from 'utils/upload/fileUploadSpecifications';
import handleError from 'utils/http/handleError';
import { fileObjectToFileRecord } from 'utils/upload/processUpload';
import integrationTestConstants from 'utils/integrationTestConstants';
import endUserMessages from 'utils/endUserMessages';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const extraHelpText = {
  [sampleTech['10X']]: () => <></>,
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
};

const FileUploadModal = (props) => {
  const { onUpload, onCancel, currentSelectedTech } = props;

  const guidanceFileLink = 'https://drive.google.com/file/d/1VPaB-yofuExinY2pXyGEEx-w39_OPubO/view';

  const [selectedTech, setSelectedTech] = useState(sampleTech['10X']);
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    setCanUpload(filesList.length && filesList.every((file) => file.valid));
  }, [filesList]);

  // Handle on Drop
  const onDrop = async (droppedFiles) => {
    let filesNotInFolder = false;
    if (currentSelectedTech && currentSelectedTech !== selectedTech) {
      handleError('error', endUserMessages.ERROR_SAMPLE_TECHNOLOGY);
      return;
    }

    const filteredFiles = droppedFiles
      // Remove all hidden files
      .filter((file) => !file.name.startsWith('.') && !file.name.startsWith('__MACOSX'))
      // Remove all files that aren't in a folder
      .filter((file) => {
        const inFolder = file.path.includes('/');

        filesNotInFolder ||= !inFolder;

        return inFolder;
      })
      .filter((file) => techOptions[selectedTech].isNameValid(file.name));

    if (filesNotInFolder) {
      handleError('error', endUserMessages.ERROR_FILES_FOLDER);
    }

    const newFiles = await Promise.all(filteredFiles.map((file) => (
      fileObjectToFileRecord(file, selectedTech)
    )));

    setFilesList([...filesList, ...newFiles]);
  };

  const removeFile = (fileName) => {
    const newArray = _.cloneDeep(filesList);

    const fileIdx = newArray.findIndex((file) => file.name === fileName);
    newArray.splice(fileIdx, 1);
    setFilesList(newArray);
  };

  const renderHelpText = () => (
    <>
      <Space direction='vertical' style={{ width: '100%' }}>
        <Paragraph>
          {techOptions[selectedTech].info}
        </Paragraph>
        <Paragraph>
          The required files for each sample are:
        </Paragraph>
        <List
          dataSource={techOptions[selectedTech].inputInfo}
          size='small'
          itemLayout='vertical'
          bordered
          renderItem={(item) => (
            <List.Item>
              {
                item.map((fileName, i) => (
                  <span key={fileName}>
                    <Text code>{`${fileName}`}</Text>
                    {i !== item.length - 1 && ' or '}
                  </span>
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
              <Select
                aria-label='sampleTechnologySelect'
                defaultValue={selectedTech}
                onChange={(value) => setSelectedTech(value)}
              >
                {Object.values(sampleTech).map((tech) => (
                  <Option key={`key-${tech}`} value={tech}>{techNamesToDisplay[tech]}</Option>
                ))}
              </Select>
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
          {selectedTech && renderHelpText()}
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
                <input data-test-id={integrationTestConstants.ids.FILE_UPLOAD_INPUT} {...getInputProps()} webkitdirectory='' />
                <Empty description='Drag and drop folders here or click to browse.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
