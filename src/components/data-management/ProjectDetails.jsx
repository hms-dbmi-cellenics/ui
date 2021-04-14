import {
  Table, Typography, Space, Tooltip, PageHeader, Button, Input,
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

import getFromApiExpectOK from '../../utils/getFromApiExpectOK';
import {
  deleteSamples, updateSample,
} from '../../redux/actions/samples';
import { updateProject } from '../../redux/actions/projects';
import processUpload from '../../utils/processUpload';
import validateSampleName from '../../utils/validateSampleName';

import UploadStatus from '../../utils/UploadStatus';

const { Text, Paragraph } = Typography;

const ProjectDetails = ({ width, height }) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const dispatch = useDispatch();

  const { data: speciesData } = useSWR(
    'https://biit.cs.ut.ee/gprofiler/api/util/organisms_list/',
    getFromApiExpectOK,
  );
  const [data, setData] = useState([]);
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

  const renderCells = (columnId, uploadStatus) => {
    if (uploadStatus === UploadStatus.UPLOADED) {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Text type='success'>{uploadStatus.message()}</Text>
        </div>
      );
    }

    if (uploadStatus === UploadStatus.UPLOADING) {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='warning'>{uploadStatus.message()}</Text>
          </Space>
        </div>
      );
    }

    if (uploadStatus === UploadStatus.UPLOAD_ERROR) {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='danger'>{uploadStatus.message()}</Text>
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
      ].includes(uploadStatus)
    ) {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='danger'>{uploadStatus.message()}</Text>
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

    if (uploadStatus === UploadStatus.DATA_MISSING) {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='danger'>Data missing</Text>
            <MetadataEditor size='small' shape='link' icon={<EditOutlined />}>
              {_.find(columns, { dataIndex: columnId }).fillInBy}
            </MetadataEditor>
          </Space>
        </div>
      );
    }

    return (
      <div style={{ whiteSpace: 'nowrap' }}>
        <Space>
          <EditableField
            deleteEnabled={false}
            value={uploadStatus}
          />
        </Space>
      </div>
    );
  };

  const renderSampleCells = (text, el, idx) => (
    <Text strong key={`sample-cell-${idx}`}>
      <EditableField
        deleteEnabled
        value={text}
        onAfterSubmit={(name) => dispatch(updateSample(el.uuid, { name }))}
        onDelete={() => dispatch(deleteSamples(el.uuid))}
        validationFunc={(name) => validateSampleName(name, sampleNames)}
      />
    </Text>
  );

  const createMetadataColumn = (name, id) => {
    const dataIndex = `metadata-${id}`;

    return ({
      title: () => (
        <Space>
          <EditableField
            deleteEnabled
            value={name}
          />
          <MetadataEditor massEdit>
            <Input />
          </MetadataEditor>
        </Space>
      ),
      fillInBy: <Input />,
      dataIndex,
      render: (value) => renderCells(dataIndex, value),
      width: 200,
    });
  };

  const columns = [
    {
      title: 'Sample',
      dataIndex: 'name',
      fixed: true,
      render: renderSampleCells,
    },
    {
      title: 'Barcodes.csv',
      dataIndex: 'barcodes',
      render: (text) => renderCells('barcodes', text),
    },
    {
      title: 'Genes.csv',
      dataIndex: 'genes',
      render: (text) => renderCells('genes', text),
    },
    {
      title: 'Matrix.mtx',
      dataIndex: 'matrix',
      render: (text) => renderCells('matrix', text),
    },
    {
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
      render: (text) => renderCells('species', text),
      width: 200,
    },
    createMetadataColumn('Tissue', 'tissue'),
    createMetadataColumn('Patient ID', 'patient'),
    createMetadataColumn('Collection date', 'collection-date'),
    createMetadataColumn('Sequencing date', 'sequencing-date'),
  ];

  useEffect(() => {
    if (samples.ids.length === 0 || projects.ids.length === 0) {
      setData([]);
      return;
    }

    const newData = projects[activeProjectUuid].samples.map((sampleUuid, idx) => {
      const sampleFiles = samples[sampleUuid].files;

      const barcodesStatus = sampleFiles['barcodes.tsv.gz']?.status;
      const genesStatus = (sampleFiles['genes.tsv.gz'] ?? sampleFiles['features.tsv.gz'])?.status;
      const matrixStatus = sampleFiles['matrix.mtx.gz']?.status;

      return {
        key: idx,
        name: samples[sampleUuid].name,
        uuid: sampleUuid,
        barcodes: barcodesStatus ?? UploadStatus.FILE_NOT_FOUND,
        genes: genesStatus ?? UploadStatus.FILE_NOT_FOUND,
        matrix: matrixStatus ?? UploadStatus.FILE_NOT_FOUND,
        species: 'dataMissing',
      };
    });
    setData(newData);
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
            <Button>Add metadata</Button>,
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
          columns={columns}
          dataSource={data}
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
