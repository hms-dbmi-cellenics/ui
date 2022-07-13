// this returns a formatted array for the select element;
import _ from 'lodash';

import { metadataKeyToName } from 'utils/data-management/metadataUtils';

const getSelectOptions = (options) => {
  const selectOptions = [];
  if (!options.length) {
    return;
  }

  Array.from(options).forEach((option) => {
    // We need to translate 'scratchpad' into 'custom cell sets' because
    // that is what is displayed in Data Exploration
    const label = option.key === 'scratchpad' ? 'custom cell sets' : option.key;

    selectOptions.push({
      value: option.key,
      label: _.upperFirst(metadataKeyToName(label)),
    });
  });
  return selectOptions;
};

export default getSelectOptions;
