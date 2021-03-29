import {
  Table, Typography, Space, Tooltip, PageHeader, Button, Input,
} from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ReloadOutlined, UploadOutlined, EditOutlined } from '@ant-design/icons';
import _ from 'lodash';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import SpeciesSelector from './SpeciesSelector';
import MetadataEditor from './MetadataEditor';
import EditableField from '../EditableField';
import FileUploadModal from './FileUploadModal';
import getFromApiExpectOK from '../../utils/getFromApiExpectOK';

const { Text } = Typography;

const ProjectDetails = ({ width, height }) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const { data: speciesData } = useSWR(
    'https://biit.cs.ut.ee/gprofiler/api/util/organisms_list/',
    getFromApiExpectOK,
  );

  const [data, setData] = useState([]);
  const [sortedSpeciesData, setSortedSpeciesData] = useState([]);
  const samples = useSelector((state) => state.samples);
  const sampleIds = samples.ids;

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

  const renderSampleCells = (text) => (
    <Text strong>
      <EditableField
        deleteEnabled
        value={text}
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
      title: 'Sample ID',
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
    if (data.length === 0) {
      const statuses = ['uploaded', 'uploading', 'uploadError', 'fileNotFound'];
      const newData = sampleIds.map((uuid, idx) => ({
        key: idx,
        name: samples[uuid].name,
        uuid,
        barcodes: _.sample(statuses),
        genes: _.sample(statuses),
        matrix: _.sample(statuses),
        species: 'dataMissing',
      }));

      setData(newData);
    }
  }, [samples]);

  return (
    <>
      <FileUploadModal
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onUpload={() => setUploadModalVisible(false)}
      />
      <div width={width} height={height}>
        <PageHeader
          title='A sample project name'
          extra={[
            <Button onClick={() => setUploadModalVisible(true)}>Add sample</Button>,
            <Button>Add metadata</Button>,
            <Button type='primary'>Launch analysis</Button>,
          ]}
        >
          <Text strong>Description:</Text>
          {' '}
          <Text editable>Here is where the description of your project would go. Lorem ipsum.</Text>
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
