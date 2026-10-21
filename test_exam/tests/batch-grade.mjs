/**
 * Batch Grading Tool for Teachers
 * Case: Mobile Phone Distributor Ltd.
 * 
 * Automatically grades all students listed in student.csv against running server(s)
 * or records their scores and exports grade report in CSV and Markdown formats.
 * 
 * Usage:
 *   node tests/batch-grade.mjs [baseUrl]
 *   Example: node tests/batch-grade.mjs http://localhost:3000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = process.argv[2] || 'http://localhost:3000';
const csvPath = path.resolve(__dirname, '../student.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`student.csv not found at ${csvPath}`);
  process.exit(1);
}

const csvLines = fs.readFileSync(csvPath, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean);
const students = [];

for (let i = 1; i < csvLines.length; i++) {
  const [id, name, secretKey] = csvLines[i].split(',').map(s => s?.trim());
  if (id) students.push({ id, name, secretKey });
}

console.log(`\n============================================================`);
console.log(` 🎓 Teacher Batch Grading Assistant`);
console.log(` Target Server : ${baseUrl}`);
console.log(` Students Count: ${students.length}`);
console.log(`============================================================\n`);

async function gradeStudent(student) {
  const sid = student.id;
  const apiPrefix = `${baseUrl}/api/${sid}`;
  const scores = {
    identity: 0, // max 10
    brands: 0,   // max 10
    pagination: 0, // max 15
    summaryDto: 0, // max 10
    detailDto: 0,  // max 10
    crudPost: 0,   // max 10
    crudPut: 0,    // max 10
    crudDelete: 0, // max 10
    errorConflict: 0, // max 5
    envelope: 0,   // max 5
    routeStyle: 0, // max 5
  };

  const logs = [];

  try {
    // 1. Identity Check (10 pts)
    const idRes = await fetch(`${apiPrefix}/student-info`, { signal: AbortSignal.timeout(2000) });
    if (idRes.status === 200) {
      const json = await idRes.json();
      const d = json.data || json;
      if (String(d.studentId).trim() === String(student.id).trim() && 
          String(d.secretKey).trim() === String(student.secretKey).trim()) {
        scores.identity = 10;
      } else {
        logs.push(`Identity mismatch: got ID=${d.studentId}, Key=${d.secretKey}`);
      }
    } else {
      logs.push(`student-info returned HTTP ${idRes.status}`);
    }
  } catch (e) {
    logs.push(`student-info failed: ${e.message}`);
  }

  try {
    // 2. Brands Check (10 pts)
    const bListRes = await fetch(`${apiPrefix}/brands`, { signal: AbortSignal.timeout(2000) });
    if (bListRes.status === 200) {
      const bList = (await bListRes.json()).data;
      if (Array.isArray(bList) && bList.length >= 5) scores.brands += 5;
    }
    const bOneRes = await fetch(`${apiPrefix}/brands/1`, { signal: AbortSignal.timeout(2000) });
    const b404Res = await fetch(`${apiPrefix}/brands/99999`, { signal: AbortSignal.timeout(2000) });
    if (bOneRes.status === 200 && b404Res.status === 404) scores.brands += 5;
  } catch (e) {
    logs.push(`Brands check error: ${e.message}`);
  }

  try {
    // 3. Products Pagination & Summary DTO (25 pts)
    const pRes = await fetch(`${apiPrefix}/products?page=1&limit=10`, { signal: AbortSignal.timeout(2000) });
    if (pRes.status === 200) {
      const pJson = await pRes.json();
      if (pJson.pagination && pJson.pagination.total >= 50 && pJson.pagination.page == 1) {
        scores.pagination = 15;
      }
      if (Array.isArray(pJson.data) && pJson.data.length > 0) {
        const item = pJson.data[0];
        if (item.id && item.sku && item.name && item.category && item.price) {
          scores.summaryDto = 10;
        }
      }
      if (pJson.success === true && pJson.timestamp) {
        scores.envelope = 5;
      }
    }
  } catch (e) {
    logs.push(`Products pagination error: ${e.message}`);
  }

  try {
    // 4. Product Detail DTO & 404 (10 pts)
    const pOne = await fetch(`${apiPrefix}/products/1`, { signal: AbortSignal.timeout(2000) });
    const p404 = await fetch(`${apiPrefix}/products/99999`, { signal: AbortSignal.timeout(2000) });
    if (pOne.status === 200 && p404.status === 404) {
      scores.detailDto = 10;
    }
  } catch (e) {
    logs.push(`Product detail error: ${e.message}`);
  }

  let createdId = null;
  try {
    // 5. POST Product (10 pts)
    const testSku = `BATCH-${sid.slice(-4)}-${Date.now().toString().slice(-4)}`;
    const postRes = await fetch(`${apiPrefix}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: testSku,
        name: 'Batch Evaluation Phone',
        brand_id: 1,
        category: 'FLAGSHIP',
        price: 29999.00,
        ram_gb: 12,
        storage_gb: 256,
        color: 'Black',
        stock_quantity: 10,
        status: 'AVAILABLE'
      }),
      signal: AbortSignal.timeout(2000)
    });
    if (postRes.status === 201) {
      scores.crudPost = 10;
      const postJson = await postRes.json();
      createdId = (postJson.data || postJson.result || postJson)?.id;
    }

    // 6. Conflict check (5 pts)
    const dupRes = await fetch(`${apiPrefix}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'APL-IP15PM-256-NT',
        name: 'Dup Phone',
        brand_id: 1,
        category: 'FLAGSHIP',
        price: 48900.00,
        ram_gb: 8,
        storage_gb: 256,
        color: 'Natural',
        stock_quantity: 5,
        status: 'AVAILABLE'
      }),
      signal: AbortSignal.timeout(2000)
    });
    if (dupRes.status === 409 || dupRes.status === 400) {
      scores.errorConflict = 5;
    }

    // 7. PUT Product (10 pts)
    if (createdId) {
      const putRes = await fetch(`${apiPrefix}/products/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 27999.00 }),
        signal: AbortSignal.timeout(2000)
      });
      if (putRes.status === 200) scores.crudPut = 10;

      // 8. DELETE Product (10 pts)
      const delRes = await fetch(`${apiPrefix}/products/${createdId}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(2000)
      });
      if (delRes.status === 204 || delRes.status === 200) scores.crudDelete = 10;
    }
  } catch (e) {
    logs.push(`CRUD error: ${e.message}`);
  }

  // 9. Route Style
  scores.routeStyle = 5;

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    student,
    scores,
    totalScore,
    logs
  };
}

async function run() {
  const results = [];

  for (const st of students) {
    process.stdout.write(`Evaluating ${st.id} (${st.name}) ... `);
    const r = await gradeStudent(st);
    results.push(r);
    console.log(`${r.totalScore}/100 pts`);
  }

  // Generate Reports
  const csvReportPath = path.resolve(__dirname, 'grade-summary.csv');
  let csvContent = 'StudentID,Name,SecretKey,Identity(10),Brands(10),Pagination(15),SummaryDTO(10),DetailDTO(10),POST(10),PUT(10),DELETE(10),Conflict(5),Envelope(5),Route(5),TotalScore(100),Notes\n';

  for (const r of results) {
    const s = r.scores;
    csvContent += `"${r.student.id}","${r.student.name}","${r.student.secretKey}",${s.identity},${s.brands},${s.pagination},${s.summaryDto},${s.detailDto},${s.crudPost},${s.crudPut},${s.crudDelete},${s.errorConflict},${s.envelope},${s.routeStyle},${r.totalScore},"${r.logs.join('; ')}"\n`;
  }
  fs.writeFileSync(csvReportPath, csvContent, 'utf-8');

  const mdReportPath = path.resolve(__dirname, 'grade-summary.md');
  let mdContent = `# 📊 รายงานผลการประเมินคะแนนสอบปฏิบัติการ (Grade Summary Report)
**Case:** Mobile Phone Distributor Ltd.  
**วันเวลาที่ประเมิน:** ${new Date().toLocaleString()}  

| รหัสนักศึกษา | ชื่อ - นามสกุล | Secret Key | Identity (10) | Brands (10) | Products Query (25) | Products Modify (30) | Standards (15) | **คะแนนรวม (100)** |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;

  for (const r of results) {
    const s = r.scores;
    const queryScore = s.pagination + s.summaryDto;
    const modifyScore = s.crudPost + s.crudPut + s.crudDelete;
    const stdScore = s.errorConflict + s.envelope + s.routeStyle;
    mdContent += `| \`${r.student.id}\` | ${r.student.name} | \`${r.student.secretKey}\` | ${s.identity} | ${s.brands} | ${queryScore} | ${modifyScore} | ${stdScore} | **${r.totalScore}** |\n`;
  }

  fs.writeFileSync(mdReportPath, mdContent, 'utf-8');

  console.log(`\n============================================================`);
  console.log(` Grading Completed!`);
  console.log(` CSV Report saved to : ${csvReportPath}`);
  console.log(` Markdown Report saved: ${mdReportPath}`);
  console.log(`============================================================\n`);
}

run();
