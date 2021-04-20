import CustomError from './customError';
import fetchAPI from './fetchAPI';

const getFromApiExpectOK = async (url) => {
  let response = null;
  if (url[0] === '/') {
    response = await fetchAPI(url);
  } else {
    response = await fetch(url);
  }

  console.warn('hello there now', response);

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  console.warn('hello there again', response.status);

  throw new CustomError('There has been an error fetching the data.', response);
};

export default getFromApiExpectOK;
