import {
  Table, Typography, Space, Tooltip, PageHeader, Button, Input, Progress,
} from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ReloadOutlined, UploadOutlined, EditOutlined } from '@ant-design/icons';
import _ from 'lodash';
import PropTypes from 'prop-types';
import useSWR from 'swr';

import SpeciesSelector from './SpeciesSelector';
import MetadataEditor from './MetadataEditor';
import EditableField from '../EditableField';
import FileUploadModal from './FileUploadModal';
import MetadataPopover from './MetadataPopover';

import getFromApiExpectOK from '../../utils/getFromApiExpectOK';
import {
  deleteSamples, updateSample,
} from '../../redux/actions/samples';
import {
  updateProject,
  createMetadataTrack,
  updateMetadataTrack,
  deleteMetadataTrack,
} from '../../redux/actions/projects';
import processUpload from '../../utils/processUpload';
import validateSampleName from '../../utils/validateSampleName';
import { metadataNameToKey, temporaryMetadataKey } from '../../utils/metadataUtils';

import UploadStatus from '../../utils/UploadStatus';

const { Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const dispatch = useDispatch();

  const { data: speciesData } = useSWR(
    'https://biit.cs.ut.ee/gprofiler/api/util/organisms_list/',
    getFromApiExpectOK,
  );
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [sortedSpeciesData, setSortedSpeciesData] = useState([]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;
  const [sampleNames, setSampleNames] = useState(new Set());

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  useEffect(() => {
    if (activeProject) {
      setSampleNames(new Set(activeProject.samples.map((id) => samples[id].name.trim())));
    }
  }, [samples, projects]);

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
    const { status, progress = null } = tableCellData;

    if (status === UploadStatus.UPLOADED) {
      return (
        <Space>
          <div style={{
            whiteSpace: 'nowrap',
            height: '35px',
            minWidth: '90px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          >
            <Text type='success'>{status.message()}</Text>
          </div>
        </Space>
      );
    }

    if (status === UploadStatus.UPLOADING) {
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
            <Text type='warning'>{`${status.message()}`}</Text>
            {progress ? (<Progress percent={progress} size='small' />) : <div />}
          </Space>
        </div>
      );
    }

    if (status === UploadStatus.UPLOAD_ERROR) {
      return (
        <div style={{ whiteSpace: 'nowrap', height: '35px', minWidth: '90px' }}>
          <Space>
            <Text type='danger'>{status.message()}</Text>
            <Tooltip placement='bottom' title='Retry' mouseLeaveDelay={0}>
              <Button
                size='small'
                shape='link'
                icon={<ReloadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              />
            </Tooltip>
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
        <div style={{ whiteSpace: 'nowrap', height: '35px', minWidth: '90px' }}>
          <Space>
            <Text type='danger'>{status.message()}</Text>
            <Tooltip placement='bottom' title='Upload missing' mouseLeaveDelay={0}>
              <Button
                size='small'
                shape='link'
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              />
            </Tooltip>
          </Space>
        </div>
      );
    }

    if (status === UploadStatus.DATA_MISSING) {
      return (
        <div style={{ whiteSpace: 'nowrap', height: '35px', minWidth: '90px' }}>
          <Space>
            <Text type='danger'>Data missing</Text>
            <MetadataEditor size='small' shape='link' icon={<EditOutlined />}>
              {_.find(tableColumns, { dataIndex: columnId }).fillInBy}
            </MetadataEditor>
          </Space>
        </div>
      );
    }
  };

  const renderEditableFieldCell = (initialText, cellText, record, dataIndex, rowIdx) => (
    <div key={`cell-${dataIndex}-${rowIdx}`} style={{ whiteSpace: 'nowrap' }}>
      <Space>
        <EditableField
          deleteEnabled={false}
          value={cellText || initialText}
          onAfterSubmit={(value) => {
            dispatch(updateSample(record.uuid, { metadata: { [dataIndex]: value } }));
          }}
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
        onDelete={() => dispatch(deleteSamples(record.uuid))}
        validationFunc={(name) => validateSampleName(name, sampleNames)}
      />
    </Text>
  );

  const createMetadataColumn = () => {
    const key = temporaryMetadataKey(tableColumns);

    const metadataColumn = {
      key,
      title: () => (
        <MetadataPopover
          onCreate={(name) => {
            initializeMetadataColumn(name);
          }}
          onCancel={() => {
            deleteMetadataColumn(key);
          }}
          message='Provide new metadata track name'
          visible
        >
          <Space>
            New Metadata Track
          </Space>
        </MetadataPopover>
      ),
      fillInBy: <Input />,
      width: 200,
    };

    setTableColumns([...tableColumns, metadataColumn]);
  };

  const deleteMetadataColumn = (name) => {
    setTableColumns([...tableColumns.filter((entryName) => entryName !== name)]);
    dispatch(deleteMetadataTrack(name, activeProjectUuid));
  };

  const initializeMetadataColumn = (name) => {
    const key = metadataNameToKey(name);

    const updatedMetadataColumn = {
      key,
      title: () => (
        <Space>
          <EditableField
            deleteEnabled
            onDelete={(e, currentName) => deleteMetadataColumn(currentName)}
            onAfterSubmit={(newName) => dispatch(updateMetadataTrack(key, newName, activeProjectUuid))}
            value={name}
          />
          <MetadataEditor massEdit>
            <Input />
          </MetadataEditor>
        </Space>
      ),
      fillInBy: <Input />,
      width: 200,
      dataIndex: key,
      render: (cellValue, record, rowIdx) => renderEditableFieldCell('N.A.', cellValue, record, key, rowIdx),
    };

    setTableColumns([...tableColumns, updatedMetadataColumn]);
    dispatch(createMetadataTrack(name, activeProjectUuid));
  };

  useEffect(() => {
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
            <MetadataEditor massEdit>
              <SpeciesSelector data={sortedSpeciesData} />
            </MetadataEditor>
          </Space>
        ),
        fillInBy: <SpeciesSelector data={sortedSpeciesData} />,
        dataIndex: 'species',
        render: (text) => renderEditableFieldCell('species', text),
        width: 200,
      },
    ];

    setTableColumns(columns);
  }, []);

  useEffect(() => {
    if (samples.ids.length === 0 || projects.ids.length === 0) {
      setTableData([]);
      return;
    }

    const newData = projects[activeProjectUuid].samples.map((sampleUuid, idx) => {
      const sampleFiles = samples[sampleUuid].files;

      const barcodesUpload = sampleFiles['barcodes.tsv.gz']?.upload ?? { status: UploadStatus.FILE_NOT_FOUND };
      const genesUpload = (sampleFiles['genes.tsv.gz'] ?? sampleFiles['features.tsv.gz'])?.upload ?? { status: UploadStatus.FILE_NOT_FOUND };
      const matrixUpload = sampleFiles['matrix.mtx.gz']?.upload ?? { status: UploadStatus.FILE_NOT_FOUND };

      return {
        key: idx,
        name: samples[sampleUuid].name,
        uuid: sampleUuid,
        barcodes: barcodesUpload,
        genes: genesUpload,
        matrix: matrixUpload,
        species: 'N.A.',
      };
    });

    setTableData(newData);
  }, [projects, samples, activeProjectUuid]);

  const changeDescription = (description) => {
    dispatch(updateProject(activeProjectUuid, { description }));
  };

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUpload={uploadFiles}
      />
      <div width={width} height={height}>
        <PageHeader
          title={activeProject.name}
          extra={[
            <Button onClick={() => setUploadModalVisible(true)}>Add sample</Button>,
            <Tooltip
              title='Add samples to add metadata'
              trigger='hover'
            >
              <Button
                disabled={samples.ids.length === 0}
                onClick={() => createMetadataColumn()}
              >
                Add metadata
              </Button>
            </Tooltip>,
            <Button type='primary'>Launch analysis</Button>,
          ]}
        >
          <Space direction='vertical' size='small'>
            <Text strong>Description:</Text>
            <Paragraph
              editable={{ onChange: changeDescription }}
            >
              {activeProject.description}

            </Paragraph>
          </Space>
        </PageHeader>

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
      </div>
    </>
  );
};

ProjectDetails.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default ProjectDetails;
