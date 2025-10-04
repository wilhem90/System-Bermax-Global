export default async function requestApi(url, method = 'GET', data = {}) {
  const baseUrl = 'http://localhost:8080/api/' + url;

  console.log(data)
  const options = {
    method,
    headers: {
      deviceid: data.deviceid,
      'Authorization': `Bearer ${data.token}`
    },
  };
  
  // Adiciona o body apenas se for método que envia dados
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  
  try {
    console.log(options)
    const response = await fetch(baseUrl, options);
    console.log(response)

    // Converte a resposta para JSON, tratando erros
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao conectar com a API');
    }

    return result;
  } catch (error) {
    console.error('Erro na requestApi:', error.message);
    return { success: false, error: error.message };
  }
}
