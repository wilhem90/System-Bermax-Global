async function requestApi(endPoint, method = 'GET', token, data) {
    console.log(data)
  let baseUrl = 'http://localhost:8080/api/' + endPoint;
  const options = {
    method,
    headers: {},
  };
  if (endPoint === 'users/create-user') {
    options.body = JSON.stringify(data);
  }
  if (endPoint.includes('users/login')) {
    options.body = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
    options.headers['deviceid'] = data.deviceid;
  }
  console.log(options)
  const responseApi = await fetch(baseUrl, options);
  let result;
  try {
    result = await responseApi.json();
  } catch (error) {
    throw new Error('Invalid JSON response ' + error);
  }
  if (!responseApi.ok) {
    throw new Error(
      result?.message || 'Request failed with status ' + responseApi.status
    );
  }
  return result;
}

export default requestApi;
