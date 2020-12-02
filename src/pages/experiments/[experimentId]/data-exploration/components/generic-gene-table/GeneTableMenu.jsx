import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Space, Select,
} from 'antd';
import { useSelector } from 'react-redux';
import SelectionIndicator from './SelectionIndicator';

const GeneTableMenu = (props) => {
  const { onExportCSV, experimentId } = props;
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [listed, setListed] = useState(false);

  const onListSelected = (flag) => { setListed(flag); };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <>
        <SelectionIndicator
          experimentId={experimentId}
          showCSV={onExportCSV !== null}
          onExportCSV={onExportCSV}
          onListSelected={onListSelected}
        />
        {listed ? (
          <Select
            value={selectedGenes}
            mode='multiple'
            showArrow={false}
            removeIcon={(<div />)}
            style={{ width: '100%' }}
          />
        ) : (<></>)}
      </>
      <Button
        type='link'
        size='small'
        onClick={() => { }}
      >
        Heatmap
      </Button>
    </Space>
  );
};

GeneTableMenu.defaultProps = {
  onExportCSV: () => null,
};

GeneTableMenu.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onExportCSV: PropTypes.func,
};

export default GeneTableMenu;
