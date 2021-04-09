import getApiEndpoint from '../apiEndpoint';

const getExperimentInfo = async (context) => {
  const { req } = context;

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const apiUrl = getApiEndpoint(url);

  console.log(apiUrl);

  return {
    props: {
      url,
      apiUrl,
    },
  };
};

export default getExperimentInfo;
