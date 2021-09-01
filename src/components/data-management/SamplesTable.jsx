/* eslint-disable import/no-unresolved */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Table, Row, Col, Typography,
} from 'antd';
import { DEFAULT_NA } from 'redux/reducers/projects/initialState';
import { updateExperiment } from 'redux/actions/experiments';
import { updateProject } from 'redux/actions/projects';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import { Storage } from 'aws-amplify';
import UploadStatus from 'utils/upload/UploadStatus';
import { arrayMoveImmutable } from 'utils/array-move';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';

const { Paragraph } = Typography;

const SamplesTable = (props) => {
  const { tableColumns, activeProjectUuid, height } = props;
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]) || false;
  const environment = useSelector((state) => state?.networkResources?.environment);

  useEffect(() => {
    if (!activeProject || !samples[activeProject.samples[0]]) {
      setTableData([]);
      return;
    }

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
    setTableData(newData);
  }, [projects, samples, activeProjectUuid]);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      // This can be done because there is only one experiment per project
      // Has to be changed when we support multiple experiments per project
      const experimentId = activeProject.experiments[0];

      const newData = arrayMoveImmutable(tableData, oldIndex, newIndex).filter((el) => !!el);
      const newSampleOrder = newData.map((sample) => sample.uuid);

      dispatch(updateProject(activeProjectUuid, { samples: newSampleOrder }));
      dispatch(updateExperiment(experimentId, { sampleIds: newSampleOrder }));
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
  const downloadPublicDataset = async () => {
    const s3Object = await Storage.get('pbmc_3k.zip',
      {
        bucket: `biomage-public-datasets-${environment}`,
        contentDisposition: 'attachment; filename: "pbmc_3k.zip"',
        contentType: 'multipart/form-data; boundary=something',
      });
    downloadFromUrl(s3Object);
  };

  const noDataText = (
    <Paragraph>
      Start uploading your samples using the “Add samples” button.
      <br />
      Don&apos;t have data? Download an example PBMC dataset
      {' '}
      <a onClick={() => downloadPublicDataset()}>here</a>
      .
    </Paragraph>
  );
  return (
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
};

SamplesTable.propTypes = {
  height: PropTypes.number.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
  tableColumns: PropTypes.array.isRequired,
};

export default React.memo(SamplesTable);
