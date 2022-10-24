// eslint-disable-next-line camelcase
import { JSON_parse } from 'uint8array-json-parser';

const resultParsers = {
  GetNormalizedExpression: (result) => result,
  default: (result) => JSON_parse(result),
};

const parseResult = (result, taskName) => {
  const parser = resultParsers[taskName] ?? resultParsers.default;

  return parser(result);
};

export default parseResult;
