const fetch = require('node-fetch');

const API_BASE_URL = "http://192.168.1.7:5000";

async function testBackendConnection() {
  console.log('🔍 Probando conexión al backend...');
  console.log(`📍 URL: ${API_BASE_URL}`);
  console.log('');

  // Test 1: Health check
  try {
    console.log('1️⃣ Probando endpoint de salud...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   OK: ${healthResponse.ok ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Tables endpoint
  try {
    console.log('2️⃣ Probando endpoint de tablas...');
    const tablesResponse = await fetch(`${API_BASE_URL}/sales/Table/actives`);
    console.log(`   Status: ${tablesResponse.status}`);
    console.log(`   OK: ${tablesResponse.ok ? '✅' : '❌'}`);
    
    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log(`   📊 Tablas encontradas: ${tables.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Products endpoint
  try {
    console.log('3️⃣ Probando endpoint de productos...');
    const productsResponse = await fetch(`${API_BASE_URL}/sales/Product/actives`);
    console.log(`   Status: ${productsResponse.status}`);
    console.log(`   OK: ${productsResponse.ok ? '✅' : '❌'}`);
    
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`   📦 Productos encontrados: ${products.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 4: Inventory endpoint
  try {
    console.log('4️⃣ Probando endpoint de inventario...');
    const inventoryResponse = await fetch(`${API_BASE_URL}/inventory/Inventory/actives`);
    console.log(`   Status: ${inventoryResponse.status}`);
    console.log(`   OK: ${inventoryResponse.ok ? '✅' : '❌'}`);
    
    if (inventoryResponse.ok) {
      const inventory = await inventoryResponse.json();
      console.log(`   📋 Items de inventario: ${inventory.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 Resumen de la prueba:');
  console.log('   - Si todos los endpoints devuelven ✅, el backend está funcionando correctamente');
  console.log('   - Si hay ❌, verifica:');
  console.log('     • Que el backend esté ejecutándose');
  console.log('     • Que la IP 192.168.1.2 sea correcta');
  console.log('     • Que el puerto 5000 esté abierto');
  console.log('     • Que no haya firewall bloqueando la conexión');
}

// Ejecutar la prueba
testBackendConnection().catch(console.error); 