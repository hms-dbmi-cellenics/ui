import React, { useState, useEffect } from 'react';
import {
  Table, Typography, Space, Tooltip, PageHeader, Button, Input, Progress,
} from 'antd';
import { useRouter } from 'next/router';
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
import filesToCheck from '../../utils/sampleFilesPerTechnology';

const { Text, Paragraph } = Typography;

const DataPanel = ({ width, height }) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const analysisPath = '/experiments/[experimentId]/data-processing';

  const { data: speciesData } = useSWR(
    'https://biit.cs.ut.ee/gprofiler/api/util/organisms_list/',
    getFromApiExpectOK,
  );
  const [tableData, setTableData] = useState([]);
  const [sortedSpeciesData, setSortedSpeciesData] = useState([]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;
  const [sampleNames, setSampleNames] = useState(new Set());
  const [canLaunchAnalysis, setCanLaunchAnalysis] = useState(false);

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
              {_.find(columns, { dataIndex: columnId }).fillInBy}
            </MetadataEditor>
          </Space>
        </div>
      );
    }
  };

  const renderEditableFieldCell = (text) => (
    <div style={{ whiteSpace: 'nowrap' }}>
      <Space>
        <EditableField
          deleteEnabled={false}
          value={text}
        />
      </Space>
    </div>
  );

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
      render: (value) => renderEditableFieldCell(dataIndex, value),
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
      render: (tableCellData) => renderUploadCell('barcodes', tableCellData),
    },
    {
      title: 'Genes.csv',
      dataIndex: 'genes',
      render: (tableCellData) => renderUploadCell('genes', tableCellData),
    },
    {
      title: 'Matrix.mtx',
      dataIndex: 'matrix',
      render: (tableCellData) => renderUploadCell('matrix', tableCellData),
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
      render: (text) => renderEditableFieldCell('species', text),
      width: 200,
    },
    createMetadataColumn('Tissue', 'tissue'),
    createMetadataColumn('Patient ID', 'patient'),
    createMetadataColumn('Collection date', 'collection-date'),
    createMetadataColumn('Sequencing date', 'sequencing-date'),
  ];

  const checkLaunchAnalysis = () => {
    const canLaunch = activeProject?.samples.length > 0
      && activeProject?.samples.every((sampleUuid) => {
        const checkedSample = samples[sampleUuid];

        if (!_.isEqual(
          Array.from(new Set(checkedSample.fileNames)),
          filesToCheck[checkedSample.type],
        )) { return false; }

        return checkedSample.fileNames.every((fileName) => {
          const checkedFile = checkedSample.files[fileName];

          return checkedFile.valid && checkedFile.upload.status === UploadStatus.UPLOADED;
        });
      });

    setCanLaunchAnalysis(canLaunch);
  };

  useEffect(() => {
    if (projects.ids.length === 0 || samples.ids.length === 0) {
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
        species: 'dataMissing',
      };
    });

    checkLaunchAnalysis();
    setTableData(newData);
  }, [projects, samples, activeProjectUuid]);

  const changeDescription = (description) => {
    dispatch(updateProject(activeProjectUuid, { description }));
  };

  const launchAnalysis = () => {
    // Change this when multiple experiments in a project is supported
    const chosenExperimentId = activeProject.experiments[0];

    // Check upload status of all files
    if (canLaunchAnalysis) {
      router.push(analysisPath.replace('[experimentId]', chosenExperimentId));
    }
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
            <Button type='primary' disabled={!canLaunchAnalysis} onClick={() => launchAnalysis()}>Launch analysis</Button>,
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
          dataSource={tableData}
          sticky
          pagination={false}
        />
      </div>
    </>
  );
};

DataPanel.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default DataPanel;
