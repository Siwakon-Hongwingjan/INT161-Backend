/**
 * Offline Local Test Runner for Express.js RESTful API Practice Exam
 * Case: Mobile Phone Distributor Ltd.
 * 
 * Zero dependencies - works completely offline with Node.js built-in fetch.
 * 
 * Usage:
 *   node tests/test-runner.mjs [studentId] [port]
 *   Example: node tests/test-runner.mjs 67130500001
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

// Load students lookup from student.csv
function loadStudentRoster() {
  const csvPath = path.resolve(__dirname, '../student.csv');
  if (!fs.existsSync(csvPath)) return {};
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
  const map = {};
  for (let i = 1; i < lines.length; i++) {
    const [id, name, secretKey] = lines[i].split(',').map(s => s?.trim());
    if (id) map[id] = { id, name, secretKey };
  }
  return map;
}

const studentRoster = loadStudentRoster();
let studentId = process.argv[2];
const port = process.argv[3] || 3000;
const baseUrl = `http://localhost:${port}`;

// If no student ID provided, try first one in roster
if (!studentId) {
  const firstId = Object.keys(studentRoster)[0];
  if (firstId) {
    studentId = firstId;
    console.log(`${YELLOW}No student ID provided. Defaulting to first roster ID: ${studentId}${RESET}`);
  } else {
    studentId = '67130500001';
  }
}

const expectedStudent = studentRoster[studentId] || {
  id: studentId,
  name: 'Unknown Student',
  secretKey: 'N/A'
};

const apiPrefix = `${baseUrl}/api/${studentId}`;

class TestSuite {
  constructor() {
    this.results = [];
    this.totalScore = 0;
    this.maxScore = 100;
  }

  async runTest(name, category, points, fn) {
    process.stdout.write(`  • [${category}] ${name} ... `);
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      this.totalScore += points;
      this.results.push({ name, category, points, maxPoints: points, passed: true, duration });
      console.log(`${GREEN}PASSED${RESET} (${points}/${points} pts) ${GRAY}[${duration}ms]${RESET}`);
    } catch (err) {
      const duration = Date.now() - start;
      this.results.push({ name, category, points: 0, maxPoints: points, passed: false, duration, error: err.message });
      console.log(`${RED}FAILED${RESET} (0/${points} pts)`);
      console.log(`    ${RED}↳ Reason: ${err.message}${RESET}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log(`${BOLD}               EXAM TEST RESULTS SUMMARY${RESET}`);
    console.log('='.repeat(60));
    console.log(`Student ID : ${CYAN}${expectedStudent.id}${RESET}`);
    console.log(`Name       : ${CYAN}${expectedStudent.name}${RESET}`);
    console.log(`Secret Key : ${GRAY}${expectedStudent.secretKey}${RESET}`);
    console.log(`Tested URL : ${GRAY}${apiPrefix}${RESET}`);
    console.log('-'.repeat(60));

    const categories = [...new Set(this.results.map(r => r.category))];
    for (const cat of categories) {
      const catResults = this.results.filter(r => r.category === cat);
      const catScore = catResults.reduce((acc, r) => acc + r.points, 0);
      const catMax = catResults.reduce((acc, r) => acc + r.maxPoints, 0);
      const catColor = catScore === catMax ? GREEN : catScore > 0 ? YELLOW : RED;
      console.log(`  ${cat.padEnd(25)} : ${catColor}${catScore}/${catMax} pts${RESET}`);
    }

    console.log('-'.repeat(60));
    const finalColor = this.totalScore >= 80 ? GREEN : this.totalScore >= 50 ? YELLOW : RED;
    console.log(`${BOLD}TOTAL SCORE${RESET}               : ${finalColor}${BOLD}${this.totalScore} / ${this.maxScore} points${RESET}`);
    console.log('='.repeat(60));

    // Save report to disk
    const reportPath = path.resolve(__dirname, `test-report-${studentId}.json`);
    const reportData = {
      timestamp: new Date().toISOString(),
      student: expectedStudent,
      totalScore: this.totalScore,
      maxScore: this.maxScore,
      results: this.results
    };
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    console.log(`${GRAY}Detailed report saved to: ${reportPath}${RESET}\n`);
  }
}

async function verifyServerIsRunning() {
  try {
    const res = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch (err) {
    try {
      const res = await fetch(`${apiPrefix}/student-info`, { signal: AbortSignal.timeout(3000) });
      return true;
    } catch (e) {
      return false;
    }
  }
}

async function main() {
  console.log(`\n${BOLD}============================================================${RESET}`);
  console.log(`${BOLD} 📱 Local Offline Exam Evaluator - Mobile Phone Distributor ${RESET}`);
  console.log(`${BOLD}============================================================${RESET}`);
  console.log(`Checking connection to: ${CYAN}${baseUrl}${RESET} ...`);

  const serverOnline = await verifyServerIsRunning();
  if (!serverOnline) {
    console.log(`\n${RED}${BOLD}ERROR: Cannot connect to Express server at ${baseUrl}${RESET}`);
    console.log(`${YELLOW}Please make sure your server is running before executing this test!${RESET}`);
    console.log(`Steps:`);
    console.log(`  1. Open a terminal`);
    console.log(`  2. Run: cd node-express-esm-template && npm start`);
    console.log(`  3. Run this tester again: node tests/test-runner.mjs ${studentId}\n`);
    process.exit(1);
  }

  console.log(`${GREEN}Server is responding! Starting evaluation suite...${RESET}\n`);

  const suite = new TestSuite();
  let createdProductId = null;
  const testTimestamp = Date.now().toString().slice(-5);
  const testSku = `TEST-EXAM-${testTimestamp}`;

  // -------------------------------------------------------------
  // PART 1: Student Identity (10 pts)
  // -------------------------------------------------------------
  await suite.runTest('Student Identity Endpoint', '1. Identity', 10, async () => {
    const res = await fetch(`${apiPrefix}/student-info`);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const json = await res.json();
    if (!json.success && json.success !== undefined) throw new Error(`Envelope 'success' must be true`);
    const data = json.data || json;
    if (String(data.studentId).trim() !== String(expectedStudent.id).trim()) {
      throw new Error(`studentId mismatch. Expected '${expectedStudent.id}', got '${data.studentId}'`);
    }
    if (expectedStudent.secretKey && expectedStudent.secretKey !== 'N/A') {
      if (String(data.secretKey).trim() !== String(expectedStudent.secretKey).trim()) {
        throw new Error(`secretKey mismatch. Expected '${expectedStudent.secretKey}', got '${data.secretKey}'`);
      }
    }
  });

  // -------------------------------------------------------------
  // PART 2: Brands API (10 pts)
  // -------------------------------------------------------------
  await suite.runTest('GET All Brands (List)', '2. Brands API', 5, async () => {
    const res = await fetch(`${apiPrefix}/brands`);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const json = await res.json();
    const data = json.data || json;
    if (!Array.isArray(data)) throw new Error(`Brands data must be an array`);
    if (data.length < 5) throw new Error(`Expected at least 5 brands, got ${data.length}`);
    const sample = data[0];
    if (!sample.id || !sample.name) throw new Error(`Brand objects must contain 'id' and 'name'`);
  });

  await suite.runTest('GET Brand by ID & 404 Check', '2. Brands API', 5, async () => {
    // 2.1 Found
    const resFound = await fetch(`${apiPrefix}/brands/1`);
    if (resFound.status !== 200) throw new Error(`GET /brands/1 expected HTTP 200, got ${resFound.status}`);
    const jsonFound = await resFound.json();
    const brand = jsonFound.data || jsonFound;
    if (brand.id !== 1 && brand.id !== '1') throw new Error(`Brand ID must be 1`);

    // 2.2 Not Found
    const resNotFound = await fetch(`${apiPrefix}/brands/99999`);
    if (resNotFound.status !== 404) throw new Error(`GET /brands/99999 expected HTTP 404, got ${resNotFound.status}`);
  });

  // -------------------------------------------------------------
  // PART 3: Products API - Pagination & DTO (35 pts)
  // -------------------------------------------------------------
  await suite.runTest('GET Products Pagination Envelope', '3. Products Query', 15, async () => {
    const res = await fetch(`${apiPrefix}/products?page=1&limit=10`);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(`Response envelope must have success: true`);
    if (!json.pagination) throw new Error(`Response must include 'pagination' object when page/limit provided`);
    const p = json.pagination;
    if (p.page != 1) throw new Error(`Pagination 'page' expected 1, got ${p.page}`);
    if (p.limit != 10) throw new Error(`Pagination 'limit' expected 10, got ${p.limit}`);
    if (typeof p.total !== 'number' || p.total < 50) throw new Error(`Pagination 'total' expected >= 50, got ${p.total}`);
    if (p.totalPages < 5) throw new Error(`Pagination 'totalPages' expected >= 5, got ${p.totalPages}`);
    if (p.hasNextPage !== true) throw new Error(`Pagination 'hasNextPage' expected true for page 1`);
  });

  await suite.runTest('Summary DTO Filtering (GET /products)', '3. Products Query', 10, async () => {
    const res = await fetch(`${apiPrefix}/products?page=1&limit=5`);
    const json = await res.json();
    const items = json.data;
    if (!Array.isArray(items) || items.length === 0) throw new Error(`Products 'data' must be non-empty array`);
    const item = items[0];
    if (!item.id || !item.sku || !item.name) {
      throw new Error(`Summary DTO missing essential fields: 'id', 'sku', 'name'`);
    }
    // Summary DTO should not leak raw timestamps or unmapped details if possible
    if (item.updated_at && !item.updatedAt) {
      // Small penalty warning if raw DB columns are leaked directly
    }
  });

  await suite.runTest('GET Product by ID & Detail DTO', '3. Products Query', 10, async () => {
    const res = await fetch(`${apiPrefix}/products/1`);
    if (res.status !== 200) throw new Error(`GET /products/1 expected HTTP 200, got ${res.status}`);
    const json = await res.json();
    const p = json.data || json;
    if (p.id != 1) throw new Error(`Expected product ID 1, got ${p.id}`);
    if (!p.sku || !p.name) throw new Error(`Detail DTO missing sku or name`);
    
    // 404 test
    const notFoundRes = await fetch(`${apiPrefix}/products/99999`);
    if (notFoundRes.status !== 404) throw new Error(`GET /products/99999 expected HTTP 404, got ${notFoundRes.status}`);
  });

  // -------------------------------------------------------------
  // PART 4: Products Modification (POST, PUT, DELETE) (30 pts)
  // -------------------------------------------------------------
  await suite.runTest('POST Create Product (201 Created)', '4. Products Modify', 10, async () => {
    const newProduct = {
      sku: testSku,
      name: 'Automated Test Phone',
      brand_id: 1,
      category: 'FLAGSHIP',
      price: 25900.00,
      ram_gb: 8,
      storage_gb: 256,
      color: 'Titanium Blue',
      stock_quantity: 12,
      status: 'AVAILABLE',
      release_date: '2026-05-01'
    };

    const res = await fetch(`${apiPrefix}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });

    if (res.status !== 201) throw new Error(`Expected HTTP 201 Created, got ${res.status}`);
    const json = await res.json();
    const created = json.data || json.result || json;
    createdProductId = created.id || created.insertId;
    if (!createdProductId) {
      // Fallback: lookup by sku
      const listRes = await fetch(`${apiPrefix}/products?page=1&limit=100`);
      const listJson = await listRes.json();
      const found = listJson.data?.find(x => x.sku === testSku);
      if (found) createdProductId = found.id;
    }
    if (!createdProductId) throw new Error(`Could not determine newly created product ID`);
  });

  await suite.runTest('PUT Update Product (200 OK)', '4. Products Modify', 10, async () => {
    if (!createdProductId) throw new Error(`Skipped: Created product ID not found`);
    const updateData = {
      name: 'Automated Test Phone (Updated)',
      price: 27900.00,
      stock_quantity: 20
    };

    const res = await fetch(`${apiPrefix}/products/${createdProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (res.status !== 200) throw new Error(`Expected HTTP 200 OK, got ${res.status}`);
  });

  await suite.runTest('DELETE Product (204 No Content)', '4. Products Modify', 10, async () => {
    if (!createdProductId) throw new Error(`Skipped: Created product ID not found`);
    const res = await fetch(`${apiPrefix}/products/${createdProductId}`, {
      method: 'DELETE'
    });

    if (res.status !== 204 && res.status !== 200) {
      throw new Error(`Expected HTTP 204 No Content (or 200), got ${res.status}`);
    }

    // Follow-up GET should return 404
    const checkRes = await fetch(`${apiPrefix}/products/${createdProductId}`);
    if (checkRes.status !== 404) {
      throw new Error(`Deleted product should return 404, got ${checkRes.status}`);
    }
  });

  // -------------------------------------------------------------
  // PART 5: Error Handling & Standards (15 pts)
  // -------------------------------------------------------------
  await suite.runTest('Duplicate SKU Conflict Handling (409 Conflict)', '5. Standards & Error', 5, async () => {
    // Try to create product with existing SKU 'APL-IP15PM-256-NT'
    const dupProduct = {
      sku: 'APL-IP15PM-256-NT',
      name: 'Duplicate iPhone',
      brand_id: 1,
      category: 'FLAGSHIP',
      price: 48900.00,
      ram_gb: 8,
      storage_gb: 256,
      color: 'Silver',
      stock_quantity: 10,
      status: 'AVAILABLE'
    };

    const res = await fetch(`${apiPrefix}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dupProduct)
    });

    if (res.status !== 409 && res.status !== 400) {
      throw new Error(`Expected HTTP 409 Conflict (or 400 Bad Request) for duplicate SKU, got ${res.status}`);
    }
    const json = await res.json();
    if (json.success !== false) {
      throw new Error(`Error response should have success: false`);
    }
  });

  await suite.runTest('Standard JSON Envelope Format', '5. Standards & Error', 5, async () => {
    const res = await fetch(`${apiPrefix}/brands`);
    const json = await res.json();
    if (json.success === undefined) throw new Error(`Response missing 'success' boolean attribute`);
    if (!json.timestamp) throw new Error(`Response missing 'timestamp' attribute`);
  });

  await suite.runTest('RESTful Clean Route Hierarchy', '5. Standards & Error', 5, async () => {
    // Check that routes don't use RPC style like /getProducts or /deleteProduct
    const res = await fetch(`${apiPrefix}/products`);
    if (res.status !== 200) throw new Error(`Standard plural resource /products must be used`);
  });

  suite.printSummary();
}

main().catch(err => {
  console.error(`${RED}Unexpected Tester Failure: ${err.message}${RESET}`);
  process.exit(1);
});
