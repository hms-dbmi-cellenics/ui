/* eslint-disable react/jsx-props-no-spreading */
import React, {
  useEffect, useState, forwardRef, useImperativeHandle,
} from 'react';
import Storage from '@aws-amplify/storage';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Row, Col, Typography, Space, Button, Empty,
} from 'antd';
import {
  MenuOutlined,
} from '@ant-design/icons';
import { sortableHandle, sortableContainer, sortableElement } from 'react-sortable-hoc';

import config from 'config';
import { api } from 'utils/constants';

import MetadataColumnTitle from 'components/data-management/MetadataColumn';
import MetadataPopover from 'components/data-management/MetadataPopover';
import {
  UploadCell, SampleNameCell, EditableFieldCell,
} from 'components/data-management/SamplesTableCells';

import {
  updateProject,
  deleteMetadataTrack,
  createMetadataTrack,
} from 'redux/actions/projects';
import { DEFAULT_NA } from 'redux/reducers/projects/initialState';
import { reorderSamples, updateExperiment } from 'redux/actions/experiments';
import { updateSample } from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import { arrayMoveImmutable } from 'utils/array-move';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';
import { metadataNameToKey, metadataKeyToName, temporaryMetadataKey } from 'utils/data-management/metadataUtils';
import integrationTestConstants from 'utils/integrationTestConstants';

import 'utils/css/data-management.css';

const { Paragraph, Text } = Typography;

const exampleDatasets = [
  {
    filename: 'PBMC_3k.zip',
    description: 'Uni-sample PBMC dataset',
  },
  {
    filename: 'PBMC_BMMC_17k.zip',
    description: 'Multi-sample blood and bone marrow dataset',
  },
];

const SamplesTable = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]);

  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);

  const { activeProjectUuid } = useSelector((state) => state.projects.meta) || false;
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;
  const environment = useSelector((state) => state?.networkResources?.environment);

  const [sampleNames, setSampleNames] = useState(new Set());
  const DragHandle = sortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);

  const initialTableColumns = [
    {
      fixed: 'left',
      index: 0,
      key: 'sort',
      dataIndex: 'sort',
      width: 30,
      render: () => <DragHandle />,
    },
    {
      className: `${integrationTestConstants.classes.SAMPLE_CELL}`,
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
      render: (tableCellData) => <UploadCell columnId='barcodes' tableCellData={tableCellData} />,
    },
    {
      index: 3,
      key: 'genes',
      title: 'genes.tsv',
      dataIndex: 'genes',
      render: (tableCellData) => <UploadCell columnId='genes' tableCellData={tableCellData} />,
    },
    {
      index: 4,
      key: 'matrix',
      title: 'matrix.mtx',
      dataIndex: 'matrix',
      render: (tableCellData) => <UploadCell columnId='matrix' tableCellData={tableCellData} />,
    },
  ];

  const [tableColumns, setTableColumns] = useState(initialTableColumns);

  useEffect(() => {
    if (activeProject.samples.length > 0) {
      // if there are samples - build the table columns
      setSampleNames(new Set(activeProject.samples.map((id) => samples[id]?.name.trim())));
      const metadataColumns = activeProject.metadataKeys.map(
        (metadataKey) => createInitializedMetadataColumn(metadataKeyToName(metadataKey)),
      ) || [];
      setTableColumns([...initialTableColumns, ...metadataColumns]);
    } else {
      setTableColumns([]);
      setSampleNames(new Set());
    }
  }, [samples, activeProject]);

  const deleteMetadataColumn = (name) => {
    dispatch(deleteMetadataTrack(name, activeProjectUuid));
  };

  const createInitializedMetadataColumn = (name) => {
    const key = metadataNameToKey(name);

    return {
      key,
      title: () => (
        <MetadataColumnTitle
          name={name}
          sampleNames={sampleNames}
          setCells={setCells}
          deleteMetadataColumn={deleteMetadataColumn}
          activeProjectUuid={activeProjectUuid}
        />
      ),
      width: 200,
      dataIndex: key,
      render: (cellValue, record, rowIdx) => (
        <EditableFieldCell
          cellText={cellValue}
          dataIndex={key}
          rowIdx={rowIdx}
          onAfterSubmit={(newValue) => {
            dispatch(updateSample(record.uuid, { metadata: { [key]: newValue } }));
          }}
        />
      ),
    };
  };

  const onMetadataCreate = (name) => {
    dispatch(createMetadataTrack(name, activeProjectUuid));
  };

  useImperativeHandle(ref, () => ({

    createMetadataColumn() {
      const key = temporaryMetadataKey(tableColumns);
      const metadataCreateColumn = {
        key,
        fixed: 'right',
        title: () => (
          <MetadataPopover
            existingMetadata={activeProject.metadataKeys}
            onCreate={(name) => {
              onMetadataCreate(name);
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
        width: 200,
      };
      setTableColumns([...tableColumns, metadataCreateColumn]);
    },
  }));

  const MASS_EDIT_ACTIONS = [
    'REPLACE_EMPTY',
    'REPLACE_ALL',
    'CLEAR_ALL',
  ];

  const setCells = (value, metadataKey, actionType) => {
    if (!MASS_EDIT_ACTIONS.includes(actionType)) return;
    const updateObject = { metadata: { [metadataKey]: value } };

    const canUpdateCell = (sampleUuid, action) => {
      if (action !== 'REPLACE_EMPTY') return true;

      const isMetadataEmpty = (uuid) => (
        !samples[uuid].metadata[metadataKey]
        || samples[uuid].metadata[metadataKey] === DEFAULT_NA
      );

      return isMetadataEmpty(sampleUuid);
    };

    activeProject.samples.forEach(
      (sampleUuid) => {
        if (canUpdateCell(sampleUuid, actionType)) {
          dispatch(updateSample(sampleUuid, updateObject));
        }
      },
    );
  };

  useEffect(() => {
    if (activeProject.samples.length === 0) {
      setTableData([]);
      return;
    }

    const newData = activeProject.samples.map((sampleUuid, idx) => {
      // upload problems sometimes lead to partial updates and incosistent states
      // in this situation it's possible that the sampleUuid does not exist
      // this a temporary fix so that the whole UI doesn't crash preventing the
      // user from removing the dataset or uploading another one.
      const sampleFiles = samples[sampleUuid]?.files || {};

      const barcodesFile = sampleFiles['barcodes.tsv.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };
      const genesFile = sampleFiles['features.tsv.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };
      const matrixFile = sampleFiles['matrix.mtx.gz'] ?? { upload: { status: UploadStatus.FILE_NOT_FOUND } };

      const barcodesData = { sampleUuid, file: barcodesFile };
      const genesData = { sampleUuid, file: genesFile };
      const matrixData = { sampleUuid, file: matrixFile };

      return {
        key: idx,
        name: samples[sampleUuid]?.name || 'UPLOAD ERROR: Please reupload sample',
        uuid: sampleUuid,
        barcodes: barcodesData,
        genes: genesData,
        matrix: matrixData,
        ...samples[sampleUuid]?.metadata,
      };
    });
    setTableData(newData);
  }, [projects, samples, activeProjectUuid]);

  const downloadPublicDataset = async (filename) => {
    const s3Object = await Storage.get(
      filename,
      {
        bucket: `biomage-public-datasets-${environment}`,
        contentType: 'multipart/form-data',
      },
    );
    downloadFromUrl(s3Object);
  };

  const noDataText = (
    <Empty
      imageStyle={{
        height: 60,
      }}
      description={(
        <Space size='middle' direction='vertical'>
          <Paragraph>
            Start uploading your samples by clicking on Add samples.
          </Paragraph>
          <Text>
            Don&apos;t have data? Get started using one of our example datasets:
          </Text>
          <div style={{ width: 'auto', textAlign: 'left' }}>
            <ul>
              {
                exampleDatasets.map(({ filename, description }) => (
                  <li key={filename}>
                    <Button
                      type='link'
                      size='small'
                      onClick={() => downloadPublicDataset(filename)}
                    >
                      {description}
                    </Button>
                  </li>
                ))
              }
            </ul>
          </div>
        </Space>
      )}
    />
  );

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      // This can be done because there is only one experiment per project
      // Has to be changed when we support multiple experiments per project
      const experimentId = activeProject.experiments[0];

      const newData = arrayMoveImmutable(tableData, oldIndex, newIndex).filter((el) => !!el);
      const newSampleOrder = newData.map((sample) => sample.uuid);

      dispatch(updateProject(activeProjectUuid, { samples: newSampleOrder }));

      if (config.currentApiVersion === api.V1) {
        dispatch(updateExperiment(experimentId, { sampleIds: newSampleOrder }));
      } else if (config.currentApiVersion === api.V2) {
        dispatch(reorderSamples(activeProjectUuid, oldIndex, newIndex, newSampleOrder));
      }
      setTableData(newData);
    }
  };

  const SortableRow = sortableElement((otherProps) => <tr {...otherProps} className={`${otherProps.className} drag-visible`} />);
  const SortableTable = sortableContainer((otherProps) => <tbody {...otherProps} />);

  const DragContainer = (otherProps) => (
    <SortableTable
      useDragHandle
      disableAutoscroll
      helperClass='row-dragging'
      onSortEnd={onSortEnd}
      {...otherProps}
    />
  );

  const DraggableRow = (otherProps) => {
    const index = tableData.findIndex((x) => x.key === otherProps['data-row-key']);
    return <SortableRow index={index} {...otherProps} />;
  };

  return (
    <Row>
      <Col>
        <Table
          id='samples-table'
          size='small'
          scroll={{
            x: 'max-content',
          }}
          bordered
          columns={tableColumns}
          dataSource={tableData}
          sticky
          pagination={false}
          locale={{ emptyText: noDataText }}
          components={{
            body: {
              wrapper: DragContainer,
              row: DraggableRow,
            },
          }}
        />
      </Col>
    </Row>
  );
});

export default React.memo(SamplesTable);

export {
  exampleDatasets,
};
