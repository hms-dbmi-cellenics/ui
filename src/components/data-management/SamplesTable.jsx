/* eslint-disable react/jsx-props-no-spreading */
import _ from 'lodash';
import React, {
  useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback,
} from 'react';
import { useVT } from 'virtualizedtableforantd4';

import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Row, Typography, Space, Alert,
} from 'antd';
import {
  MenuOutlined,
} from '@ant-design/icons';
import { sortableHandle } from 'react-sortable-hoc';

import ReactResizeDetector from 'react-resize-detector';
import { ClipLoader } from 'react-spinners';

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
import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';

import DraggableBodyRow from 'components/data-management/DraggableBodyRow';

import { metadataNameToKey, metadataKeyToName, temporaryMetadataKey } from 'utils/data-management/metadataUtils';
import integrationTestConstants from 'utils/integrationTestConstants';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import fileUploadSpecifications from 'utils/upload/fileUploadSpecifications';
import 'utils/css/data-management.css';

const { Text } = Typography;

const SamplesTable = forwardRef((props, ref) => {
  const dispatch = useDispatch();

  const [fullTableData, setFullTableData] = useState([]);

  const samples = useSelector((state) => state.samples);

  const samplesLoading = useSelector((state) => state.samples.meta.loading);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const samplesValidating = useSelector(
    (state) => state.samples.meta.validating.includes(activeExperimentId),
  );

  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const parentExperimentName = useSelector(
    (state) => state.experiments[activeExperiment?.parentExperimentId]?.name,
  );

  const selectedTech = useSelector(
    (state) => state.samples[activeExperiment?.sampleIds[0]]?.type,
    _.isEqual,
  );

  const [sampleNames, setSampleNames] = useState(new Set());
  const DragHandle = sortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);

  const [samplesLoaded, setSamplesLoaded] = useState(false);

  const initialTableColumns = useMemo(() => ([
    {
      fixed: 'left',
      index: 0,
      key: 'sort',
      dataIndex: 'sort',
      width: 50,
      render: () => <DragHandle />,
    },
    {
      className: `${integrationTestConstants.classes.SAMPLE_CELL}`,
      index: 1,
      key: 'sample',
      title: 'Sample',
      dataIndex: 'name',
      fixed: 'left',
      render: (text, record, indx) => (
        <SampleNameCell cellInfo={{ text, record, indx }} />
      ),
    },
    ...fileUploadSpecifications[selectedTech]?.requiredFiles?.map((fileName, indx) => {
      const fileNameWithoutExtension = fileName.key.split('.')[0];

      return ({
        index: 2 + indx,
        title: <center>{fileName.displayedName}</center>,
        key: fileNameWithoutExtension,
        dataIndex: fileNameWithoutExtension,
        width: 170,
        onCell: () => ({ style: { margin: '0px', padding: '0px' } }),
        render: (tableCellData) => tableCellData && (
          <UploadCell
            columnId={fileName.key}
            sampleUuid={tableCellData.sampleUuid}
          />
        ),
      });
    }) || [],

  ]), [selectedTech]);

  const [tableColumns, setTableColumns] = useState(initialTableColumns);

  useEffect(() => {
    if (activeExperiment?.sampleIds.length > 0 && samplesLoaded) {
      // if there are samples - build the table columns
      const sanitizedSampleNames = new Set(
        activeExperiment.sampleIds.map((id) => samples[id]?.name.trim()),
      );

      setSampleNames(sanitizedSampleNames);
      const metadataColumns = activeExperiment.metadataKeys.map(
        (metadataKey) => createInitializedMetadataColumn(metadataKeyToName(metadataKey)),
      ) || [];
      setTableColumns([...initialTableColumns, ...metadataColumns]);
    }
  }, [samples, activeExperiment?.sampleIds, samplesLoaded]);

  useConditionalEffect(() => {
    setSamplesLoaded(false);

    dispatch(loadSamples(activeExperimentId));
  }, [activeExperimentId]);

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
          sampleUuid={record.uuid}
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
      const previousTableColumns = tableColumns;
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
              setTableColumns(previousTableColumns);
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

  const generateDataForItem = useCallback((sampleUuid) => {
    const sampleFileNames = fileUploadSpecifications[selectedTech]?.requiredFiles
      .map((fileName) => ([
        fileName.key.split('.')[0],
        { sampleUuid },
      ]));

    return {
      key: sampleUuid,
      name: samples[sampleUuid]?.name || 'UPLOAD ERROR: Please reupload sample',
      uuid: sampleUuid,
      ...Object.fromEntries(sampleFileNames),
    };
  }, [activeExperiment?.sampleIds, selectedTech, samples]);

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
          {
            samplesLoading ? 'We\'re getting your samples ...'
              : samplesValidating ? 'We\'re validating your samples ...'
                : ''
          }
        </Text>
      </Row>
    </>
  );

  useEffect(() => {
    if (!activeExperiment?.sampleIds.length) {
      setFullTableData([]);
      return;
    }

    const alreadyInTable = () => _.isEqual(
      fullTableData.map(({ key }) => key),
      activeExperiment.sampleIds,
    );

    const anyNotLoadedYet = () => activeExperiment.sampleIds.some((sampleId) => !samples[sampleId]);

    if (alreadyInTable() || anyNotLoadedYet()) return;

    const newData = activeExperiment.sampleIds.map((sampleUuid) => generateDataForItem(sampleUuid));

    setFullTableData(newData);
  }, [activeExperiment?.sampleIds, samples]);

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const newSamplesLoaded = activeExperiment?.sampleIds.every((sampleId) => samples[sampleId]);

    if (newSamplesLoaded === true && samplesLoaded === false) {
      setSamplesLoaded(true);
    }
  }, [activeExperiment, samples]);

  const [VT, setVT] = useVT(
    () => ({
      scroll: { y: size.height },
    }),
    [size.height],
  );

  useMemo(() => setVT({ body: { row: DraggableBodyRow } }), []);

  const locale = {
    emptyText: (
      <ExampleExperimentsSpace
        introductionText='Start uploading your samples by clicking on Add samples.'
        imageStyle={{ height: 60 }}
      />
    ),
  };

  const moveRow = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    await dispatch(reorderSamples(activeExperimentId, fromIndex, toIndex));
  };

  const renderSamplesTable = () => (
    <ReactResizeDetector
      handleHeight
      refreshMode='throttle'
      refreshRate={500}
      onResize={(height) => { setSize({ height }); }}
    >
      {() => (
        <Table
          scroll={{ y: size.height, x: 'max-content' }}
          components={VT}
          columns={tableColumns}
          dataSource={fullTableData}
          locale={locale}
          showHeader={activeExperiment?.sampleIds.length > 0}
          pagination={false}
          onRow={(record, index) => ({
            index,
            moveRow,
          })}
          sticky
          bordered
        />
      )}
    </ReactResizeDetector>
  );

  return (
    <>
      {
        activeExperiment?.parentExperimentId ? (
          <center>
            <Alert
              type='info'
              message='Subsetted experiment'
              description={(
                <>
                  This is a subset of
                  {' '}
                  <b>{parentExperimentName}</b>
                  .
                  <br />
                  You can  see remaining samples after subsetting in
                  the data processing and data exploration pages.
                </>
              )}
            />
          </center>
        )
          : !samplesLoaded || samplesLoading || samplesValidating
            ? renderLoader()
            : renderSamplesTable()
      }
    </>
  );
});

export default SamplesTable;
