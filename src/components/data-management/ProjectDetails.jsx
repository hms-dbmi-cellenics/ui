/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect, useRef } from 'react';
import {
  Typography, Space,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import {
  MenuOutlined,
} from '@ant-design/icons';
import { sortableHandle } from 'react-sortable-hoc';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import moment from 'moment';
import SpeciesSelector from './SpeciesSelector';
import MetadataEditor from './MetadataEditor';
import FileUploadModal from './FileUploadModal';
import AnalysisModal from './AnalysisModal';
import UploadDetailsModal from './UploadDetailsModal';
import SamplesTable from './SamplesTable';
import { UploadCell, EditableFieldCell, SampleNameCell } from './SamplesTableCells';
import MetadataColumn from './MetadataColumn';
import MetadataPopover from './MetadataPopover';
import { getFromUrlExpectOK } from '../../utils/getDataExpectOK';
import {
  updateSample,
} from '../../redux/actions/samples';
import {
  updateProject,
  deleteMetadataTrack,
  createMetadataTrack,
} from '../../redux/actions/projects';

import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';
import {
  updateExperiment,
} from '../../redux/actions/experiments';

import { processUpload } from '../../utils/upload/processUpload';
import validateInputs from '../../utils/validateInputs';
import { metadataNameToKey, metadataKeyToName, temporaryMetadataKey } from '../../utils/data-management/metadataUtils';
import '../../utils/css/data-management.css';
import runGem2s from '../../redux/actions/pipeline/runGem2s';
import ProjectMenu from './ProjectMenu';

const { Text } = Typography;

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
  const experiments = useSelector((state) => state.experiments);
  const samples = useSelector((state) => state.samples);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;

  const [tableColumns, setTableColumns] = useState([]);
  const [sortedSpeciesData, setSortedSpeciesData] = useState([]);
  const [sampleNames, setSampleNames] = useState(new Set());
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

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
      // if there are samples - build the table columns
      setSampleNames(new Set(activeProject.samples.map((id) => samples[id]?.name.trim())));
      const metadataColumns = activeProject?.metadataKeys.map(
        (metadataKey) => createInitializedMetadataColumn(metadataKeyToName(metadataKey)),
      ) || [];
      setTableColumns([...columns, ...metadataColumns]);
    } else {
      setTableColumns([]);
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
  const deleteMetadataColumn = (name) => {
    setTableColumns([...tableColumns.filter((entryName) => entryName !== name)]);
    dispatch(deleteMetadataTrack(name, activeProjectUuid));
  };

  const createMetadataColumn = () => {
    setIsAddingMetadata(true);

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
        <MetadataColumn
          name={name}
          validateInput={
            (newName, metadataNameValidation) => validateInputs(
              newName, metadataNameValidation, validationParams,
            ).isValid
          }
          setCells={setCells}
          deleteMetadataColumn={deleteMetadataColumn}
          key={key}
          activeProjectUuid={activeProjectUuid}
        />
      ),
      width: 200,
      dataIndex: key,
      render: (cellValue, record, rowIdx) => (
        <EditableFieldCell
          initialText={DEFAULT_NA}
          cellText={cellValue}
          dataIndex={key}
          rowIdx={rowIdx}
          onAfterSubmit={(newValue) => {
            dispatch(updateSample(record.uuid, { metadata: { [key]: newValue } }));
          }}
        />
      ),
    };
    return newMetadataColumn;
  };

  const DragHandle = sortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);

  const renderUploadCell = (columnId, tableCellData) => {
    const {
      sampleUuid,
      file,
    } = tableCellData;
    const showDetails = () => {
      uploadDetailsModalDataRef.current = {
        sampleUuid,
        fileCategory: columnId,
        file,
      };
      setUploadDetailsModalVisible(true);
    };
    return (
      <UploadCell file={file} showDetails={() => showDetails('barcodes', tableCellData)} />
    );
  };

  const columns = [
    {
      index: 0,
      key: 'sort',
      dataIndex: 'sort',
      width: 30,
      render: () => <DragHandle />,
    },
    {
      className: 'data-test-class-sample-cell',
      index: 1,
      key: 'sample',
      title: 'Sample',
      dataIndex: 'name',
      fixed: true,
      render: (text, record, indx) => <SampleNameCell cellInfo={{ text, record, indx }} />,
    },
    {
      index: 2,
      key: 'barcodes',
      title: 'barcodes.tsv',
      dataIndex: 'barcodes',
      render: (tableCellData) => renderUploadCell('barcodes', tableCellData),
    },
    {
      index: 3,
      key: 'genes',
      title: 'genes.tsv',
      dataIndex: 'genes',
      render: (tableCellData) => renderUploadCell('genes', tableCellData),
    },
    {
      index: 4,
      key: 'matrix',
      title: 'matrix.mtx',
      dataIndex: 'matrix',
      render: (tableCellData) => renderUploadCell('matrix', tableCellData),
    },
    {
      index: 5,
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

  const openAnalysisModal = () => {
    // Change the line below when multiple experiments in a project is supported
    setAnalysisModalVisible(true);
  };

  const launchAnalysis = (experimentId) => {
    dispatch(runGem2s(experimentId));
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
        onLaunch={(experimentId) => {
          const lastViewed = moment().toISOString();
          dispatch(updateExperiment(experimentId, { lastViewed }));
          dispatch(updateProject(activeProjectUuid, { lastAnalyzed: lastViewed }));
          launchAnalysis(experimentId);
        }}
        onCancel={() => { setAnalysisModalVisible(false); }}
      />
      <UploadDetailsModal
        sampleName={samples[uploadDetailsModalDataRef.current?.sampleUuid]?.name}
        uploadDetailsModalDataRef={uploadDetailsModalDataRef}
        visible={uploadDetailsModalVisible}
        onCancel={() => setUploadDetailsModalVisible(false)}
      />
      <div id='project-details' width={width} height={height}>
        <Space direction='vertical' style={{ width: '100%', padding: '8px 4px' }}>
          <ProjectMenu
            activeProjectUuid={activeProjectUuid}
            createMetadataColumn={() => createMetadataColumn()}
            isAddingMetadata={isAddingMetadata}
            setUploadModalVisible={setUploadModalVisible}
            openAnalysisModal={openAnalysisModal}
          />
          <SamplesTable
            height={height}
            activeProjectUuid={activeProjectUuid}
            tableColumns={tableColumns}
          />
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
