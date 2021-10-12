import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useSWR from 'swr';

import {
  Select, Typography, Space, Divider, Skeleton,
} from 'antd';
import { getFromUrlExpectOK } from '../../utils/getDataExpectOK';

const { Text } = Typography;

const SpeciesSelector = (props) => {
  const { value, onChange } = props;

  const { data: speciesData } = useSWR(
    'https://biit.cs.ut.ee/gprofiler/api/util/organisms_list/',
    getFromUrlExpectOK,
  );
  const [sortedSpeciesData, setSortedSpeciesData] = useState([]);

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

  if (!sortedSpeciesData || sortedSpeciesData.length === 0) {
    return <Skeleton.Input style={{ width: 300 }} size='small' />;
  }

  return (
    <Select
      value={value}
      onChange={(organismId, option) => onChange(organismId, option)}
      style={{ width: '100%' }}
      dropdownMatchSelectWidth={400}
      showSearch
      placeholder='Search for common or scientific name...'
      data-test-class='species-select'
      filterOption={(input, option) => option.searchQuery.includes(input.toLowerCase())}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <div style={{
            display: 'flex', flexWrap: 'nowrap', padding: 8,
          }}
          >
            <Text type='secondary' style={{ textAlign: 'center' }}>
              For information such as the reference genome corresponding
              to each species, click
              {' '}
              <a
                href='https://biit.cs.ut.ee/gprofiler/page/organism-list'
                target='_blank'
                rel='noreferrer'
              >
                here
              </a>
              {' '}
              (opens in new tab).
            </Text>
          </div>
        </div>
      )}
      options={
        sortedSpeciesData.map((organism) => ({
          value: organism.id,
          searchquery: `${organism.display_name} ${organism.scientific_name}`.toLowerCase(),
          label: (
            <Space direction='vertical'>
              <Text type='primary'>{organism.display_name}</Text>
              <Text type='secondary'>
                {organism.scientific_name}
              </Text>
            </Space>
          ),
        }))
      }
    />
  );
};

SpeciesSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

SpeciesSelector.defaultProps = {
  value: '',
  onChange: () => { },
};

export default SpeciesSelector;
