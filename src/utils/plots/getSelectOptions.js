// this returns a formatted array for the select element;
import _ from 'lodash';

import { metadataKeyToName } from 'utils/data-management/metadataUtils';

const getSelectOptions = (options) => {
  const selectOptions = [];
  if (!options.length) {
    return;
  }
  Array.from(options).forEach((option) => {
    selectOptions.push({
      value: option.key,
      label: _.upperFirst(metadataKeyToName(option.key)),
    });
  });
  return selectOptions;
};

export default getSelectOptions;
