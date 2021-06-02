/* eslint-disable no-param-reassign */
const metadataKeyToName = (key) => key.replace('-', ' ').replace('_', ' ');

const metadataNameToKey = (name) => `${name.trim().replace(/\s+/g, '_')}`;

const temporaryMetadataKey = (columns) => `metadata_${columns.length}`;

export {
  metadataKeyToName,
  metadataNameToKey,
  temporaryMetadataKey,
};
