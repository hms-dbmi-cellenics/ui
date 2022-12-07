const mockGenesListData = ['A', 'B', 'C', 'D'];

// const mockGeneExpressionData = {
//   A: {
//     rawExpression: {
//       min: 0,
//       max: 6.8,
//       mean: 1.68,
//       stdev: 2.597331964,
//       expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
//     },
//     truncatedExpression: {
//       min: 0,
//       max: 6.8,
//       mean: 1.68,
//       stdev: 2.597331964,
//       expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
//     },
//   },
//   B: {
//     rawExpression: {
//       min: 0,
//       max: 6.8,
//       mean: 1.702857143,
//       stdev: 2.551115536,
//       expression: [0, 0, 0, 2.56, 0, 6.8, 2.56],
//     },
//     truncatedExpression: {
//       min: 0,
//       max: 6.8,
//       mean: 1.702857143,
//       stdev: 2.551115536,
//       expression: [0, 0, 0, 2.56, 0, 6.8, 2.56],
//     },
//   },
//   C: {
//     rawExpression: {
//       min: 0,
//       max: 3.4,
//       mean: 1.68,
//       stdev: 2.141525936,
//       expression: [0, 0, 0, 3.56, 0, 4.8, 3.4],
//     },
//     truncatedExpression: {
//       min: 0,
//       max: 3.4,
//       mean: 1.68,
//       stdev: 2.141525936,
//       expression: [0, 0, 0, 3.56, 0, 4.8, 3.4],
//     },
//   },
//   D: {
//     rawExpression: {
//       min: 0,
//       max: 6.8,
//       mean: 1.68,
//       stdev: 2.597331964,
//       expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
//     },
//     truncatedExpression: {
//       min: 0,
//       max: 6.8,
//       mean: 1.68,
//       stdev: 2.597331964,
//       expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
//     },
//   },
//   E: { hello: 'world' },
// };

// const mockCacheGet = jest.fn((x) => {
//   const mockCacheContents = {
//     fd3161a878f67ebf54018720cffd6a66: 'A', // pragma: allowlist secret
//     '10250a11679234110a1c260d6fd81d3c': 'B', // pragma: allowlist secret
//     f5c957411a28de68f35e1f5c8a29da7e: 'C', // pragma: allowlist secret
//     '33faa711a94a2028b5bae1778126aec0': 'E', // pragma: allowlist secret
//   };

//   if (x in mockCacheContents) {
//     return mockGeneExpressionData[mockCacheContents[x]];
//   }

//   return null;
// });

const mockCacheGet = jest.fn(() => null);
const mockCacheSet = jest.fn();
const mockCacheRemove = jest.fn();

const mockDispatchWorkRequest = jest.fn(() => true);

const mockSeekFromS3 = jest.fn();

const mockCacheModule = {
  get: jest.fn((x) => mockCacheGet(x)),
  set: jest.fn((key, val) => mockCacheSet(key, val)),
  _remove: jest.fn((key) => mockCacheRemove(key)),
};

const mockSeekWorkResponseModule = {
  __esModule: true,
  seekFromS3: mockSeekFromS3,
  dispatchWorkRequest: mockDispatchWorkRequest,
};

const mockQcPipelineStartDate = '2021-01-01T01:01:01.000Z';

export {
  mockGenesListData, mockCacheGet, mockCacheSet,
  mockDispatchWorkRequest, mockSeekFromS3,
  mockQcPipelineStartDate, mockCacheModule, mockSeekWorkResponseModule,
};
