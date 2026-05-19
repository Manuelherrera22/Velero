const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function createTestUser() {
  const response = await fetch('https://api.mercadopago.com/users/test_user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      site_id: 'MLA'
    })
  });
  
  const data = await response.json();
  console.log('Test Buyer Account:');
  console.log(data);
}

createTestUser();
