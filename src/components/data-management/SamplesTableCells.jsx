import React from 'react';
import {
  Space, Typography, Progress, Tooltip, Button,
} from 'antd';
import {
  UploadOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  deleteSamples, updateSample,
} from '../../redux/actions/samples';
import UploadStatus, { messageForStatus } from '../../utils/upload/UploadStatus';
import EditableField from '../EditableField';

const { Text } = Typography;
const UploadCell = (props) => {
  const { file, showDetails } = props;

  const { progress = null, status = null } = file?.upload ?? {};

  if (status === UploadStatus.UPLOADED) {
    return (
      <div
        className='hoverSelectCursor'
        style={{
          whiteSpace: 'nowrap',
          height: '35px',
          minWidth: '90px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Space
          onClick={showDetails}
          onKeyDown={showDetails}
        >
          <Text type='success'>{messageForStatus(status)}</Text>
        </Space>
      </div>
    );
  }

  if (
    [
      UploadStatus.UPLOADING,
      UploadStatus.COMPRESSING,
    ].includes(status)
  ) {
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
          <Text type='warning'>{`${messageForStatus(status)}`}</Text>
          {progress ? (<Progress percent={progress} size='small' />) : <div />}
        </Space>
      </div>
    );
  }

  if (status === UploadStatus.UPLOAD_ERROR) {
    return (
      <div
        className='hoverSelectCursor'
        onClick={showDetails}
        onKeyDown={showDetails}
        style={{
          whiteSpace: 'nowrap',
          height: '35px',
          minWidth: '90px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Space>
          <Text type='danger'>{messageForStatus(status)}</Text>
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
      <div style={{
        whiteSpace: 'nowrap',
        height: '35px',
        minWidth: '90px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      >
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
      </div>
    );
  }
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

const SampleCells = (props) => {
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
SampleCells.propTypes = {
  cellInfo: PropTypes.object.isRequired,
};
export { UploadCell, EditableFieldCell, SampleCells };
