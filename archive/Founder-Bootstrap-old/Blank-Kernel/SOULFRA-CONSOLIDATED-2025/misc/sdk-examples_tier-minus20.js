/**
 * 🚀 SOULFRA SDK - Copy-Paste Examples
 * Real code that actually works
 */

const Soulfra = require('./soulfra-sdk');

// Initialize once
const soulfra = new Soulfra({
  apiKey: process.env.SOULFRA_API_KEY // or 'your-api-key-here'
});

// ============================================
// EXAMPLE 1: Protect User Financial Data
// ============================================
async function protectFinancialData() {
  const userFinancials = {
    creditCards: [
      { last4: '1234', exp: '12/25' },
      { last4: '5678', exp: '03/24' }
    ],
    bankAccount: {
      routing: '****6789',
      account: '****4321'
    },
    income: 150000,
    creditScore: 750
  };

  // Protect it (even if your database gets hacked, this is safe)
  const protected = await soulfra.protect(userFinancials, {
    securityLevel: 'maximum',
    retentionPeriod: '7years' // IRS requirement
  });

  console.log('Protected financial data:', protected.id);
  console.log('Share with accountant:', `https://share.soulfra.com/${protected.id}`);
  
  // Later, retrieve it
  const retrieved = await soulfra.retrieve(protected.id);
  console.log('Retrieved:', retrieved);
}

// ============================================
// EXAMPLE 2: Medical Records (HIPAA Compliant)
// ============================================
async function protectMedicalRecords() {
  const patientRecord = {
    patientId: 'P-12345',
    name: 'John Doe',
    dob: '1980-01-15',
    conditions: ['Diabetes Type 2', 'Hypertension'],
    medications: [
      { name: 'Metformin', dose: '500mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily' }
    ],
    lastVisit: '2024-01-20',
    notes: 'Patient responding well to treatment'
  };

  // HIPAA-compliant protection
  const protected = await soulfra.protect(patientRecord, {
    securityLevel: 'maximum',
    retentionPeriod: '6years', // HIPAA requirement
    compliance: 'HIPAA'
  });

  // Share with specialists
  await soulfra.share(protected, 'specialist@hospital.com', 'read');
  
  console.log('Medical record protected:', protected.id);
}

// ============================================
// EXAMPLE 3: Legal Documents
// ============================================
async function protectLegalDocuments() {
  const contract = {
    type: 'Employment Agreement',
    parties: ['Company ABC', 'Jane Smith'],
    terms: {
      salary: 120000,
      startDate: '2024-02-01',
      duration: '2 years',
      confidentiality: true
    },
    signatures: [
      { party: 'Company ABC', date: '2024-01-15', hash: 'abc123...' },
      { party: 'Jane Smith', date: '2024-01-16', hash: 'def456...' }
    ]
  };

  const protected = await soulfra.protect(contract, {
    securityLevel: 'maximum',
    immutable: true, // Cannot be modified
    auditLog: true   // Track all access
  });

  console.log('Legal document vault:', protected.id);
}

// ============================================
// EXAMPLE 4: Personal Photos & Videos
// ============================================
async function protectPersonalMedia() {
  // For large files, use streaming
  const photoData = {
    filename: 'family-vacation-2024.jpg',
    size: '4.5MB',
    location: 'Hawaii',
    date: '2024-06-15',
    // In production, you'd stream the actual file data
    thumbnail: 'base64-encoded-thumbnail...'
  };

  const protected = await soulfra.protect(photoData, {
    shareWith: ['spouse@email.com', 'parent@email.com'],
    allowDownload: true
  });

  console.log('Photo protected:', protected.id);
  console.log('Family album:', `https://photos.soulfra.com/album/${protected.id}`);
}

// ============================================
// EXAMPLE 5: Error Handling
// ============================================
async function demonstrateErrorHandling() {
  try {
    // Try to retrieve non-existent data
    await soulfra.retrieve('invalid-id-12345');
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('💡 Solutions:');
    error.solutions.forEach((solution, i) => {
      console.log(`   ${i + 1}. ${solution}`);
    });
    console.log('📚 Help:', error.helpUrl);
  }
}

// ============================================
// EXAMPLE 6: Search Protected Data
// ============================================
async function searchProtectedData() {
  // First, protect some data
  await soulfra.protect({ type: 'passport', number: 'US123456' });
  await soulfra.protect({ type: 'driver_license', state: 'CA' });
  await soulfra.protect({ type: 'insurance', provider: 'BlueCross' });

  // Search without exposing actual data
  const results = await soulfra.search('license');
  
  console.log('\nSearch Results:');
  results.forEach(result => {
    console.log(`- ${result.id} (created: ${result.created})`);
  });

  // Retrieve specific result
  if (results.length > 0) {
    const data = await results[0].retrieve();
    console.log('Retrieved:', data);
  }
}

// ============================================
// EXAMPLE 7: Batch Operations
// ============================================
async function batchProtect() {
  const employees = [
    { id: 1, name: 'Alice', ssn: '***-**-1234' },
    { id: 2, name: 'Bob', ssn: '***-**-5678' },
    { id: 3, name: 'Carol', ssn: '***-**-9012' }
  ];

  // Protect all employee records
  const protectedEmployees = await Promise.all(
    employees.map(emp => soulfra.protect(emp))
  );

  console.log('\nProtected employees:');
  protectedEmployees.forEach((p, i) => {
    console.log(`Employee ${i + 1}: ${p.id}`);
  });
}

// ============================================
// EXAMPLE 8: Integration with Express.js
// ============================================
function expressIntegration() {
  const express = require('express');
  const app = express();
  
  app.use(express.json());

  // Protect endpoint
  app.post('/api/protect', async (req, res) => {
    try {
      const protected = await soulfra.protect(req.body);
      res.json({ 
        success: true, 
        id: protected.id,
        retrieveUrl: protected.retrieveUrl 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        solutions: error.solutions 
      });
    }
  });

  // Retrieve endpoint
  app.get('/api/retrieve/:id', async (req, res) => {
    try {
      const data = await soulfra.retrieve(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(404).json({ 
        success: false, 
        error: error.message,
        solutions: error.solutions 
      });
    }
  });

  console.log('Express integration ready!');
}

// ============================================
// EXAMPLE 9: React Component
// ============================================
const reactExample = `
import React, { useState } from 'react';
import Soulfra from '@soulfra/sdk';

const soulfra = new Soulfra({ apiKey: process.env.REACT_APP_SOULFRA_KEY });

function ProtectDataForm() {
  const [data, setData] = useState('');
  const [protectedId, setProtectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleProtect = async () => {
    setLoading(true);
    try {
      const result = await soulfra.protect({ content: data });
      setProtectedId(result.id);
      setData(''); // Clear sensitive data
    } catch (error) {
      alert(error.solutions.join('\\n'));
    }
    setLoading(false);
  };

  return (
    <div>
      <textarea 
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Enter sensitive data..."
      />
      <button onClick={handleProtect} disabled={loading}>
        {loading ? 'Protecting...' : 'Protect Data'}
      </button>
      {protectedId && (
        <div>
          ✅ Protected! ID: {protectedId}
        </div>
      )}
    </div>
  );
}
`;

// ============================================
// RUN ALL EXAMPLES
// ============================================
async function runAllExamples() {
  console.log('🚀 SOULFRA SDK EXAMPLES\n');
  
  console.log('1️⃣ Financial Data Protection:');
  await protectFinancialData();
  
  console.log('\n2️⃣ Medical Records (HIPAA):');
  await protectMedicalRecords();
  
  console.log('\n3️⃣ Legal Documents:');
  await protectLegalDocuments();
  
  console.log('\n4️⃣ Personal Media:');
  await protectPersonalMedia();
  
  console.log('\n5️⃣ Error Handling:');
  await demonstrateErrorHandling();
  
  console.log('\n6️⃣ Search Protected Data:');
  await searchProtectedData();
  
  console.log('\n7️⃣ Batch Operations:');
  await batchProtect();
  
  console.log('\n8️⃣ Express Integration:');
  expressIntegration();
  
  console.log('\n9️⃣ React Example:');
  console.log(reactExample);
  
  console.log('\n✅ All examples complete!');
  console.log('📚 Full docs: https://docs.soulfra.com');
  console.log('💬 Questions? https://discord.gg/soulfra');
}

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  protectFinancialData,
  protectMedicalRecords,
  protectLegalDocuments,
  protectPersonalMedia,
  demonstrateErrorHandling,
  searchProtectedData,
  batchProtect,
  expressIntegration
};