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
  createSample, deleteSample, updateSampleFile, updateSample,
} from '../../redux/actions/samples';

const { Text } = Typography;

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

  const uploadFiles = (filesList, sampleType) => {
    const samplesMap = filesList.reduce((acc, file) => {
      const sampleName = file.name.trim().replace(/[\s]{2,}/ig, ' ').split('/')[0];
      const sampleUuid = Object.values(samples).filter(
        (s) => s.name === sampleName
          && s.projectUuid === projects.meta.activeProject,
      )[0]?.uuid;

      return {
        ...acc,
        [sampleName]: {
          ...acc[sampleName],
          uuid: sampleUuid,
          files: {
            ...acc[sampleName]?.files,
            [sampleName]: file,
          },
        },
      };
    }, {});

    Object.entries(samplesMap).forEach(async ([name, sample]) => {
      // Create sample if not exists
      if (!sample.uuid) {
        // eslint-disable-next-line no-param-reassign
        sample.uuid = await dispatch(createSample(projects.meta.activeProject, name, sampleType));
      }

      Object.values(sample.files).forEach((file) => {
        dispatch(updateSampleFile(sample.uuid, {
          ...file,
          path: `${projects.meta.activeProject}/${file.name.replace(name, sample.uuid)}`,
        }));
      });
    });

    setUploadModalVisible(false);
  };

  const { activeProject } = useSelector((state) => state.projects.meta) || false;
  const { name: activeProjectName, description: activeProjectDescription } = useSelector((state) => state.projects[activeProject]) || false;

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

  const renderCells = (columnId, text) => {
    if (text === 'uploaded') {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Text type='success'>Uploaded</Text>
        </div>
      );
    }

    if (text === 'uploading') {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='warning'>Uploading...</Text>
          </Space>
        </div>
      );
    }

    if (text === 'uploadError') {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='danger'>Upload error</Text>
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

    if (text === 'fileNotFound') {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          <Space>
            <Text type='danger'>File not found</Text>
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

    if (text === 'dataMissing') {
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
            value={text}
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
        onDelete={() => dispatch(deleteSample(el.uuid))}
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

    const statuses = ['uploaded', 'uploading', 'uploadError', 'fileNotFound'];
    const newData = projects[projects.meta.activeProject]?.samples.map((sampleUuid, idx) => ({
      key: idx,
      name: samples[sampleUuid].name,
      uuid: sampleUuid,
      barcodes: _.sample(statuses),
      genes: _.sample(statuses),
      matrix: _.sample(statuses),
      species: 'dataMissing',
    }));

    setData(newData);
  }, [projects, samples, projects.meta.activeProject]);

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUpload={uploadFiles}
      />
      <div width={width} height={height}>
        <PageHeader
          title={activeProjectName}
          extra={[
            <Button onClick={() => setUploadModalVisible(true)}>Add sample</Button>,
            <Button>Add metadata</Button>,
            <Button type='primary'>Launch analysis</Button>,
          ]}
        >
          <Text strong>Description:</Text>
          {' '}
          <Text editable>{activeProjectDescription}</Text>
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
