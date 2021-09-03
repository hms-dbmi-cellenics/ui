import React, { useRef, useState } from 'react';
import {
  Space, Typography, Progress, Tooltip, Button,
} from 'antd';
import {
  UploadOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  deleteSamples, updateSample,
} from '../../redux/actions/samples';
import UploadStatus, { messageForStatus } from '../../utils/upload/UploadStatus';
import EditableField from '../EditableField';
import UploadDetailsModal from './UploadDetailsModal';
import SpeciesSelector from './SpeciesSelector';

const { Text } = Typography;

const PrettyCell = styled.div`
  whiteSpace: 'nowrap';
  height: '35px';
  minWidth: '90px';
  display: 'flex';
  justifyContent: 'center';
  alignItems: 'center';
`;

const UploadCell = (props) => {
  const { columnId, tableCellData } = props;
  const {
    sampleUuid,
    file,
  } = tableCellData;
  const { progress = null, status = null } = file?.upload ?? {};
  const [uploadDetailsModalVisible, setUploadDetailsModalVisible] = useState(false);
  const uploadDetailsModalDataRef = useRef(null);

  console.log('status ', status);

  const showDetails = () => {
    uploadDetailsModalDataRef.current = {
      sampleUuid,
      fileCategory: columnId,
      file,
    };
    setUploadDetailsModalVisible(true);
  };

  const render = () => {
    if (status === UploadStatus.UPLOADED) {
      return (
        <PrettyCell
          className='hoverSelectCursor'
        >
          <Space
            onClick={showDetails}
            onKeyDown={showDetails}
          >
            <Text type='success'>{messageForStatus(status)}</Text>
          </Space>
        </PrettyCell>
      );
    }

    if (
      [
        UploadStatus.UPLOADING,
        UploadStatus.COMPRESSING,
      ].includes(status)
    ) {
      return (
        <PrettyCell>
          <Space direction='vertical' size={[1, 1]}>
            <Text type='warning'>{`${messageForStatus(status)}`}</Text>
            {progress ? (<Progress percent={progress} size='small' />) : <div />}
          </Space>
        </PrettyCell>
      );
    }

    if (status === UploadStatus.UPLOAD_ERROR) {
      return (
        <PrettyCell
          className='hoverSelectCursor'
          onClick={showDetails}
          onKeyDown={showDetails}
        >
          <Space>
            <Text type='danger'>{messageForStatus(status)}</Text>
          </Space>
        </PrettyCell>
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
        <PrettyCell>
          <Space>
            <Text type='danger'>{messageForStatus(status)}</Text>
            <Tooltip placement='bottom' title='Upload missing' mouseLeaveDelay={0}>
              <Button
                size='large'
                shape='link'
                icon={<UploadOutlined />}
                onClick={showDetails}
              />
            </Tooltip>
          </Space>
        </PrettyCell>
      );
    }
  };
  return (
    <>
      {render()}
      <UploadDetailsModal
        uploadDetailsModalDataRef={uploadDetailsModalDataRef}
        visible={uploadDetailsModalVisible}
        onCancel={() => setUploadDetailsModalVisible(false)}
      />
    </>
  );
};

UploadCell.propTypes = {
  columnId: PropTypes.string.isRequired,
  tableCellData: PropTypes.object.isRequired,
};

const EditableFieldCell = (props) => {
  const {
    initialText, cellText,
    dataIndex, rowIdx, onAfterSubmit,
  } = props;
  return (
    <div key={`cell-${dataIndex}-${rowIdx}`} style={{ whiteSpace: 'nowrap' }}>
      <Space>
        <EditableField
          deleteEnabled={false}
          value={cellText || initialText}
          onAfterSubmit={(value) => onAfterSubmit(value)}
        />
      </Space>
    </div>
  );
};
EditableFieldCell.propTypes = {
  initialText: PropTypes.string.isRequired,
  cellText: PropTypes.string.isRequired,
  dataIndex: PropTypes.string.isRequired,
  rowIdx: PropTypes.number.isRequired,
  onAfterSubmit: PropTypes.func.isRequired,
};

const SampleNameCell = (props) => {
  const { cellInfo } = props;
  const { text, record, idx } = cellInfo;
  const dispatch = useDispatch();
  return (
    <Text strong key={`sample-cell-${idx}`}>
      <EditableField
        deleteEnabled
        value={text}
        onAfterSubmit={(name) => dispatch(updateSample(record.uuid, { name }))}
        onDelete={() => dispatch(deleteSamples([record.uuid]))}
      />
    </Text>
  );
};
SampleNameCell.propTypes = {
  cellInfo: PropTypes.object.isRequired,
};

const SpeciesCell = (props) => {
  const { organismId, recordUuid } = props;
  const dispatch = useDispatch();

  return (
    <SpeciesSelector
      value={organismId}
      onChange={(value) => {
        dispatch(updateSample(recordUuid, { species: value }));
      }}
    />
  );
};

SpeciesCell.propTypes = {
  organismId: PropTypes.string.isRequired,
  recordUuid: PropTypes.string.isRequired,
};

export {
  UploadCell, EditableFieldCell, SampleNameCell, SpeciesCell,
};
