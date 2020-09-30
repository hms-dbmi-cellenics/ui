import React, { useState, useEffect } from 'react';
import {
  Button, Select,
} from 'antd';
import { useSelector } from 'react-redux';

const ListSelected = () => {
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [listed, setListed] = useState(false);

  useEffect(() => {
    setListed(false);
  }, [selectedGenes])
  if (listed) {
    return (
      <>
        <Button type='link' size='small'
          onClick={() => { setListed(false) }}
        >Hide selected</Button>
        <Select
          value={selectedGenes}
          mode='tags'
          style={{ width: '100%' }}
        />
      </>
    );
  }
  return (
    <Button type='link' size='small'
      onClick={() => { setListed(true) }}
    >List selected</Button>
  )
}

export default ListSelected;
