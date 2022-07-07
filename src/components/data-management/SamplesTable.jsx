/* eslint-disable react/jsx-props-no-spreading */
import React, {
  useEffect, useState, forwardRef, useImperativeHandle,
} from 'react';

import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Row, Col, Typography, Space,
} from 'antd';
import {
  MenuOutlined,
} from '@ant-design/icons';
import { sortableHandle, sortableContainer, sortableElement } from 'react-sortable-hoc';

import ExampleExperimentsSpace from 'components/data-management/ExampleExperimentsSpace';
import MetadataPopover from 'components/data-management/MetadataPopover';
import MetadataColumnTitle from 'components/data-management/MetadataColumn';
import { UploadCell, SampleNameCell, EditableFieldCell } from 'components/data-management/SamplesTableCells';

import {
  deleteMetadataTrack,
  createMetadataTrack,
  updateValueInMetadataTrack,
  reorderSamples,
} from 'redux/actions/experiments';

import { loadSamples } from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import { arrayMoveImmutable } from 'utils/array-move';

import { metadataNameToKey, metadataKeyToName, temporaryMetadataKey } from 'utils/data-management/metadataUtils';
import integrationTestConstants from 'utils/integrationTestConstants';
import 'utils/css/data-management.css';
import { ClipLoader } from 'react-spinners';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';

const { Text } = Typography;

const SamplesTable = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]);

  const experiments = useSelector((state) => state.experiments);
  const samples = useSelector((state) => state.samples);
  const areSamplesLoading = useSelector((state) => state.samples.meta.loading);

  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);

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
    if (activeExperiment.sampleIds.length > 0) {
      // if there are samples - build the table columns
      setSampleNames(new Set(activeExperiment.sampleIds.map((id) => samples[id]?.name.trim())));
      const metadataColumns = activeExperiment.metadataKeys.map(
        (metadataKey) => createInitializedMetadataColumn(metadataKeyToName(metadataKey)),
      ) || [];
      setTableColumns([...initialTableColumns, ...metadataColumns]);
    } else {
      setTableColumns([]);
      setSampleNames(new Set());
    }
  }, [samples, activeExperiment]);

  useConditionalEffect(() => {
    dispatch(loadSamples(activeExperimentId));
  }, [activeExperiment?.sampleIds], { lazy: true });

  const deleteMetadataColumn = (name) => {
    dispatch(deleteMetadataTrack(name, activeExperimentId));
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
          activeExperimentId={activeExperimentId}
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
            dispatch(updateValueInMetadataTrack(activeExperimentId, record.uuid, key, newValue));
          }}
        />
      ),
    };
  };

  const onMetadataCreate = (name) => {
    dispatch(createMetadataTrack(name, activeExperimentId));
  };

  useImperativeHandle(ref, () => ({

    createMetadataColumn() {
      const key = temporaryMetadataKey(tableColumns);
      const metadataCreateColumn = {
        key,
        fixed: 'right',
        title: () => (
          <MetadataPopover
            existingMetadata={activeExperiment.metadataKeys}
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

    const canUpdateCell = (sampleUuid, action) => {
      if (action !== 'REPLACE_EMPTY') return true;

      const isMetadataEmpty = (uuid) => (
        !samples[uuid].metadata[metadataKey]
        || samples[uuid].metadata[metadataKey] === METADATA_DEFAULT_VALUE
      );

      return isMetadataEmpty(sampleUuid);
    };

    activeExperiment.sampleIds.forEach(
      (sampleUuid) => {
        if (canUpdateCell(sampleUuid, actionType)) {
          dispatch(updateValueInMetadataTrack(activeExperimentId, sampleUuid, metadataKey, value));
        }
      },
    );
  };

  useEffect(() => {
    if (activeExperiment.sampleIds.length === 0) {
      setTableData([]);
      return;
    }

    const newData = activeExperiment.sampleIds.map((sampleUuid, idx) => {
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
  }, [experiments, samples, activeExperimentId]);

  const noDataComponent = (
    <ExampleExperimentsSpace
      introductionText='Start uploading your samples by clicking on Add samples.'
      imageStyle={{ height: 60 }}
    />
  );

  const onSortEnd = async ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      const newData = arrayMoveImmutable(tableData, oldIndex, newIndex).filter((el) => !!el);
      const newSampleOrder = newData.map((sample) => sample.uuid);

      try {
        await dispatch(reorderSamples(activeExperimentId, oldIndex, newIndex, newSampleOrder));
      } catch (e) {
        // If the fetch fails, avoid doing setTableData(newData)
        return;
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

  const renderLoader = () => (
    <>
      <Row justify='center'>
        <ClipLoader
          size={50}
          color='#8f0b10'
        />
      </Row>

      <Row justify='center'>
        <Text>
          We&apos;re getting your samples ...
        </Text>
      </Row>
    </>
  );

  const renderSamplesTable = () => (
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
          locale={{ emptyText: noDataComponent }}
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

  return (
    <>
      {areSamplesLoading ? renderLoader() : renderSamplesTable()}
    </>
  );
});

export default React.memo(SamplesTable);
