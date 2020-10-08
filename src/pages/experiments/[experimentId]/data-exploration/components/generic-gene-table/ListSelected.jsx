import React, { useState } from 'react';
import {
  Button, Select,
} from 'antd';
import { useSelector } from 'react-redux';

const ListSelected = () => {
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [listed, setListed] = useState(false);
  if (selectedGenes.length) {
    if (listed) {
      return (
        <>
          <Button
            type='link'
            size='small'
            onClick={() => { setListed(false); }}
          >
            Hide selected
          </Button>
          <Select
            value={selectedGenes}
            mode='multiple'
            showArrow={false}
            removeIcon={(<div />)}
            style={{ width: '100%' }}
          />
        </>
      );
    }
    return (
      <Button
        type='link'
        size='small'
        onClick={() => { setListed(true); }}
      >
        List selected
      </Button>
    );
  }
  return (null);
};
export default ListSelected;

