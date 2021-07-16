import React, { useState, useEffect, useRef } from 'react';
import {
  Table, Typography, Space, Tooltip, Button, Input, Progress, Row, Col,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import {
  UploadOutlined,
} from '@ant-design/icons';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import moment from 'moment';

import { saveAs } from 'file-saver';
import { Storage } from 'aws-amplify';
import SpeciesSelector from './SpeciesSelector';
import MetadataEditor from './MetadataEditor';
import EditableField from '../EditableField';
import FileUploadModal from './FileUploadModal';
import AnalysisModal from './AnalysisModal';
import UploadDetailsModal from './UploadDetailsModal';
import MetadataPopover from './MetadataPopover';

import { trackAnalysisLaunched } from '../../utils/tracking';
import { getFromUrlExpectOK } from '../../utils/getDataExpectOK';
import {
  deleteSamples, updateSample,
} from '../../redux/actions/samples';

import {
  updateProject,
  createMetadataTrack,
  updateMetadataTrack,
  deleteMetadataTrack,
} from '../../redux/actions/projects';

import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';

import { updateExperiment, saveExperiment } from '../../redux/actions/experiments';
import processUpload, { compressAndUploadSingleFile, metadataForBundle, renameFileIfNeeded } from '../../utils/processUpload';
import validateInputs, { rules } from '../../utils/validateInputs';
import { metadataNameToKey, metadataKeyToName, temporaryMetadataKey } from '../../utils/metadataUtils';

import UploadStatus, { messageForStatus } from '../../utils/UploadStatus';
import fileUploadSpecifications from '../../utils/fileUploadSpecifications';

import '../../utils/css/hover.css';
import runGem2s from '../../redux/actions/pipeline/runGem2s';

const { Title, Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadDetailsModalVisible, setUploadDetailsModalVisible] = useState(false);
  const uploadDetailsModalDataRef = useRef(null);

  const [isAddingMetadata, setIsAddingMetadata] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const analysisPath = '/experiments/[experimentId]/data-processing';
  const { data: speciesData } = useSWR(
    'https://biit.cs.ut.ee/gprofiler/api/util/organisms_list/',
    getFromUrlExpectOK,
  );
  const projects = useSelector((state) => state.projects);
  const experiments = useSelector((state) => state.experiments);
  const samples = useSelector((state) => state.samples);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [sortedSpeciesData, setSortedSpeciesData] = useState([]);
  const [sampleNames, setSampleNames] = useState(new Set());
  const [canLaunchAnalysis, setCanLaunchAnalysis] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

  const metadataNameValidation = [
    rules.MIN_1_CHAR,
    rules.ALPHANUM_SPACE,
    rules.START_WITH_ALPHABET,
    rules.UNIQUE_NAME_CASE_INSENSITIVE,
  ];

  const validationParams = {
    existingNames: sampleNames,
  };

  const MASS_EDIT_ACTIONS = [
    'REPLACE_EMPTY',
    'REPLACE_ALL',
    'CLEAR_ALL',
  ];

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  useEffect(() => {
    if (activeProject && activeProject.samples.length > 0) {
      setSampleNames(new Set(activeProject.samples.map((id) => samples[id]?.name.trim())));
    } else {
      setSampleNames(new Set());
    }
  }, [samples, activeProject]);

  useEffect(() => {
    if (!speciesData) {
      return;
    }

    const commonSpecies = ['hsapiens', 'mmusculus', 'drerio', 'ggallus'];

    const d = [...speciesData].sort((a, b) => {
      const indexOfA = commonSpecies.indexOf(a.id);
      const indexOfB = commonSpecies.indexOf(b.id);

      if (indexOfA > -1 && indexOfB > -1) {
        return indexOfA - indexOfB;
      }

      if (indexOfA > -1) {
        return -1;
      }

      if (indexOfB > -1) {
        return 1;
      }

      return a.scientific_name.localeCompare(b.scientific_name);
    });

    setSortedSpeciesData(d);
  }, [speciesData]);

  const renderUploadCell = (columnId, tableCellData) => {
    const {
      sampleUuid,
      file,
    } = tableCellData;
    const { progress = null, status = null } = file?.upload ?? {};
    const showDetails = () => {
      uploadDetailsModalDataRef.current = {
        sampleUuid,
        fileCategory: columnId,
        file,
      };
      setUploadDetailsModalVisible(true);
    };

    if (status === UploadStatus.UPLOADED) {
      return (
        <div
          className='hoverSelectCursor'
          style={{
            whiteSpace: 'nowrap',
            height: '35px',
            minWidth: '90px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Space
            onClick={showDetails}
            onKeyDown={showDetails}
          >
            <Text type='success'>{messageForStatus(status)}</Text>
          </Space>
        </div>
      );
    }

    if (
      [
        UploadStatus.UPLOADING,
        UploadStatus.COMPRESSING,
      ].includes(status)
    ) {
      return (
        <div style={{
          whiteSpace: 'nowrap',
          height: '35px',
          minWidth: '90px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          <Space direction='vertical' size={[1, 1]}>
            <Text type='warning'>{`${messageForStatus(status)}`}</Text>
            {progress ? (<Progress percent={progress} size='small' />) : <div />}
          </Space>
        </div>
      );
    }

    if (status === UploadStatus.UPLOAD_ERROR) {
      return (
        <div
          className='hoverSelectCursor'
          onClick={showDetails}
          onKeyDown={showDetails}
          style={{
            whiteSpace: 'nowrap',
            height: '35px',
            minWidth: '90px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Space>
            <Text type='danger'>{messageForStatus(status)}</Text>
          </Space>
        </div>
      );
    }
    if (
      [
        UploadStatus.FILE_NOT_FOUND,
        UploadStatus.FILE_READ_ABORTED,
        UploadStatus.FILE_READ_ERROR,
      ].includes(status)
    ) {
      return (
        <div style={{
          whiteSpace: 'nowrap',
          height: '35px',
          minWidth: '90px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          <Space>
            <Text type='danger'>{messageForStatus(status)}</Text>
            <Tooltip placement='bottom' title='Upload missing' mouseLeaveDelay={0}>
              <Button
                size='large'
                shape='link'
                icon={<UploadOutlined />}
                onClick={showDetails}
              />
            </Tooltip>
          </Space>
        </div>
      );
    }
  };

  const renderEditableFieldCell = (
    initialText,
    cellText,
    record,
    dataIndex,
    rowIdx,
    onAfterSubmit,
  ) => (
    <div key={`cell-${dataIndex}-${rowIdx}`} style={{ whiteSpace: 'nowrap' }}>
      <Space>
        <EditableField
          deleteEnabled={false}
          value={cellText || initialText}
          onAfterSubmit={(value) => onAfterSubmit(value, cellText, record, dataIndex, rowIdx)}
        />
      </Space>
    </div>
  );

  const renderSampleCells = (text, record, idx) => (
    <Text strong key={`sample-cell-${idx}`}>
      <EditableField
        deleteEnabled
        value={text}
        onAfterSubmit={(name) => dispatch(updateSample(record.uuid, { name }))}
        onDelete={() => dispatch(deleteSamples([record.uuid]))}
      />
    </Text>
  );

  const createMetadataColumn = () => {
    const key = temporaryMetadataKey(tableColumns);
    const metadataColumn = {
      key,
      fixed: 'right',
      title: () => (
        <MetadataPopover
          existingMetadata={activeProject.metadataKeys}
          onCreate={(name) => {
            const newMetadataColumn = createInitializedMetadataColumn(name);

            setTableColumns([...tableColumns, newMetadataColumn]);
            dispatch(createMetadataTrack(name, activeProjectUuid));

            setIsAddingMetadata(false);
          }}
          onCancel={() => {
            deleteMetadataColumn(key);
            setIsAddingMetadata(false);
          }}
          message='Provide new metadata track name'
          visible
        >
          <Space>
            New Metadata Track
          </Space>
        </MetadataPopover>
      ),
      width: 200,
    };

    setTableColumns([...tableColumns, metadataColumn]);
  };
  const deleteMetadataColumn = (name) => {
    setTableColumns([...tableColumns.filter((entryName) => entryName !== name)]);
    dispatch(deleteMetadataTrack(name, activeProjectUuid));
  };

  const createUpdateObject = (value, metadataKey) => {
    const updateObject = metadataKey === 'species' ? { species: value } : { metadata: { [metadataKey]: value } };
    return updateObject;
  };

  const setCells = (value, metadataKey, actionType) => {
    if (!MASS_EDIT_ACTIONS.includes(actionType)) return;
    const updateObject = createUpdateObject(value, metadataKey);

    const canUpdateCell = (sampleUuid, action) => {
      if (action !== 'REPLACE_EMPTY') return true;

      const isSpeciesEmpty = (uuid) => metadataKey === 'species' && !samples[uuid].species;
      const isMetadataEmpty = (uuid) => metadataKey !== 'species'
        && (!samples[uuid].metadata[metadataKey]
          || samples[uuid].metadata[metadataKey] === DEFAULT_NA);

      return isMetadataEmpty(sampleUuid) || isSpeciesEmpty(sampleUuid);
    };

    activeProject.samples.forEach(
      (sampleUuid) => {
        if (canUpdateCell(sampleUuid, actionType)) {
          dispatch(updateSample(sampleUuid, updateObject));
        }
      },
    );
  };

  const createInitializedMetadataColumn = (name) => {
    const key = metadataNameToKey(name);

    const newMetadataColumn = {
      key,
      title: () => (
        <Space>
          <EditableField
            deleteEnabled
            onDelete={(e, currentName) => deleteMetadataColumn(currentName)}
            onAfterSubmit={(newName) => dispatch(
              updateMetadataTrack(name, newName, activeProjectUuid),
            )}
            value={name}
            validationFunc={
              (newName) => validateInputs(newName, metadataNameValidation, validationParams).isValid
            }
          />
          <MetadataEditor
            onReplaceEmpty={(value) => setCells(value, key, 'REPLACE_EMPTY')}
            onReplaceAll={(value) => setCells(value, key, 'REPLACE_ALL')}
            onClearAll={() => setCells(DEFAULT_NA, key, 'CLEAR_ALL')}
            massEdit
          >
            <Input />
          </MetadataEditor>
        </Space>
      ),
      width: 200,
      dataIndex: key,
      render: (cellValue, record, rowIdx) => renderEditableFieldCell(
        DEFAULT_NA,
        cellValue,
        record,
        key,
        rowIdx,
        (newValue) => {
          dispatch(updateSample(record.uuid, { metadata: { [key]: newValue } }));
        },
      ),
    };
    return newMetadataColumn;
  };

  const columns = [
    {
      key: 'sample',
      title: 'Sample',
      dataIndex: 'name',
      fixed: true,
      render: renderSampleCells,
    },
    {
      key: 'barcodes',
      title: 'Barcodes.csv',
      dataIndex: 'barcodes',
      render: (tableCellData) => renderUploadCell('barcodes', tableCellData),
    },
    {
      key: 'genes',
      title: 'Genes.csv',
      dataIndex: 'genes',
      render: (tableCellData) => renderUploadCell('genes', tableCellData),
    },
    {
      key: 'matrix',
      title: 'Matrix.mtx',
      dataIndex: 'matrix',
      render: (tableCellData) => renderUploadCell('matrix', tableCellData),
    },
    {
      key: 'species',
      title: () => (
        <Space>
          <Text>Species</Text>
          <MetadataEditor
            onReplaceEmpty={(value) => setCells(value, 'species', 'REPLACE_EMPTY')}
            onReplaceAll={(value) => setCells(value, 'species', 'REPLACE_ALL')}
            onClearAll={() => setCells(null, 'species', 'CLEAR_ALL')}
            massEdit
          >
            <SpeciesSelector
              data={sortedSpeciesData}
            />
          </MetadataEditor>
        </Space>
      ),
      dataIndex: 'species',
      render: (organismId, record) => (
        <SpeciesSelector
          data={sortedSpeciesData}
          value={organismId}
          onChange={(value) => {
            dispatch(updateSample(record.uuid, { species: value }));
          }}
        />
      ),
      width: 200,
    },
  ];

  const checkLaunchAnalysis = () => {
    if (activeProject?.samples.length === 0) return false;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const fileNamesArray = Array.from(sample.fileNames);

      if (
        fileUploadSpecifications[sample.type].requiredFiles.every(
          (file) => !fileNamesArray.includes(file),
        )
      ) { return false; }
      return fileNamesArray.every((fileName) => {
        const checkedFile = sample.files[fileName];
        return checkedFile.valid && checkedFile.upload.status === UploadStatus.UPLOADED;
      });
    };

    const allSampleMetadataInserted = (sample) => {
      if (activeProject?.metadataKeys.length === 0) return true;
      if (Object.keys(sample.metadata).length !== activeProject.metadataKeys.length) return false;
      return Object.values(sample.metadata).every((value) => value && value.length > 0);
    };

    const canLaunch = activeProject?.samples.every((sampleUuid) => {
      const checkedSample = samples[sampleUuid];

      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    setCanLaunchAnalysis(canLaunch);
  };

  useEffect(() => {
    if (projects.ids.length === 0
      || !activeProject
      || !samples[activeProject.samples[0]]) {
      setTableData([]);
      setTableColumns([]);
      return;
    }
    // Set table columns
    const metadataColumns = activeProject?.metadataKeys.map(
      (metadataKey) => createInitializedMetadataColumn(metadataKeyToName(metadataKey)),
    ) || [];

    const newColumns = tableColumns.length ? tableColumns : [...columns, ...metadataColumns];

    setTableColumns(newColumns);
    // Set table data

    const newData = activeProject.samples.map((sampleUuid, idx) => {
      const sampleFiles = samples[sampleUuid].files;

      const barcodesFile = sampleFiles['barcodes.tsv.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };
      const genesFile = sampleFiles['features.tsv.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };
      const matrixFile = sampleFiles['matrix.mtx.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };

      const barcodesData = { sampleUuid, file: barcodesFile };
      const genesData = { sampleUuid, file: genesFile };
      const matrixData = { sampleUuid, file: matrixFile };

      return {
        key: idx,
        name: samples[sampleUuid].name,
        uuid: sampleUuid,
        barcodes: barcodesData,
        genes: genesData,
        matrix: matrixData,
        species: samples[sampleUuid].species || DEFAULT_NA,
        ...samples[sampleUuid].metadata,
      };
    });
    checkLaunchAnalysis();
    setTableData(newData);
  }, [projects, samples, activeProjectUuid]);

  const changeDescription = (description) => {
    dispatch(updateProject(activeProjectUuid, { description }));
  };

  const uploadFileBundle = (bundleToUpload) => {
    if (!uploadDetailsModalDataRef.current) {
      return;
    }
    const { sampleUuid, file } = uploadDetailsModalDataRef.current;

    // when uploading only one file - bundleToUpload doesn't have .name
    const name = file.name || bundleToUpload.name;
    const bucketKey = `${activeProjectUuid}/${sampleUuid}/${name}`;

    const metadata = metadataForBundle(bundleToUpload);

    const newFileName = renameFileIfNeeded(name, bundleToUpload.type);

    compressAndUploadSingleFile(
      bucketKey, sampleUuid, newFileName,
      bundleToUpload, dispatch, metadata,
    );

    setUploadDetailsModalVisible(false);
  };

  const downloadFile = async () => {
    const { sampleUuid, file } = uploadDetailsModalDataRef.current;
    const bucketKey = `${activeProjectUuid}/${sampleUuid}/${file.name}`;

    const downloadedS3Object = await Storage.get(bucketKey, { download: true });

    const bundleName = file?.bundle.name;
    const fileNameToSaveWith = bundleName.endsWith('.gz') ? bundleName : `${bundleName}.gz`;

    saveAs(downloadedS3Object.Body, fileNameToSaveWith);
  };

  const openAnalysisModal = () => {
    if (canLaunchAnalysis) {
      // Change the line below when multiple experiments in a project is supported
      setAnalysisModalVisible(true);
    }
  };

  const launchAnalysis = async (experimentId) => {
    trackAnalysisLaunched();
    await dispatch(runGem2s(experimentId));
    router.push(analysisPath.replace('[experimentId]', experimentId));
  };

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUpload={uploadFiles}
      />
      <AnalysisModal
        activeProject={activeProject}
        experiments={experiments}
        visible={analysisModalVisible}
        onLaunch={async (experimentId) => {
          const lastViewed = moment().toISOString();
          dispatch(updateExperiment(experimentId, { lastViewed }));
          await dispatch(saveExperiment(experimentId));
          await dispatch(updateProject(activeProjectUuid, { lastAnalyzed: lastViewed }));
          launchAnalysis(experimentId);
        }}
        onChange={() => {
          // Update experiments details
        }}
        onCancel={() => { setAnalysisModalVisible(false); }}
      />
      <UploadDetailsModal
        sampleName={samples[uploadDetailsModalDataRef.current?.sampleUuid]?.name}
        file={uploadDetailsModalDataRef.current?.file}
        fileCategory={uploadDetailsModalDataRef.current?.fileCategory}
        visible={uploadDetailsModalVisible}
        onUpload={uploadFileBundle}
        onDownload={downloadFile}
        onCancel={() => setUploadDetailsModalVisible(false)}
      />
      <div width={width} height={height}>
        <Space direction='vertical' style={{ width: '100%', padding: '8px 4px' }}>
          <Row style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Title level={3}>{activeProject.name}</Title>
            <Space>
              <Button
                disabled={projects.ids.length === 0}
                onClick={() => setUploadModalVisible(true)}
              >
                Add samples
              </Button>
              <Button
                disabled={
                  projects.ids.length === 0
                  || activeProject?.samples?.length === 0
                  || isAddingMetadata
                }
                onClick={() => {
                  setIsAddingMetadata(true);
                  createMetadataColumn();
                }}
              >
                Add metadata
              </Button>
              <Button
                type='primary'
                disabled={
                  projects.ids.length === 0
                  || activeProject?.samples?.length === 0
                  || !canLaunchAnalysis
                }
                onClick={() => openAnalysisModal()}
              >
                Launch analysis
              </Button>
            </Space>
          </Row>

          <Row>
            <Col>
              {
                activeProjectUuid && (
                  <Space direction='vertical' size='small'>
                    <Text type='secondary'>{`ID : ${activeProjectUuid}`}</Text>
                    <Text strong>Description:</Text>
                    <Paragraph
                      editable={{ onChange: changeDescription }}
                    >
                      {activeProject.description}

                    </Paragraph>
                  </Space>
                )
              }
            </Col>
          </Row>

          <Row>
            <Col>
              <Table
                size='small'
                scroll={{
                  x: 'max-content',
                  y: height - 250,
                }}
                bordered
                columns={tableColumns}
                dataSource={tableData}
                sticky
                pagination={false}
              />
            </Col>
          </Row>
        </Space>
      </div>
    </>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
