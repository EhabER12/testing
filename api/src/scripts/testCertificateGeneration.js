/**
 * Test Script for Certificate PDF Generation
 * 
 * This script tests the certificate generation flow to verify:
 * 1. Course data is properly fetched and populated
 * 2. Student name is correctly retrieved
 * 3. PDF is generated with all fields populated
 * 
 * Usage: node src/scripts/testCertificateGeneration.js [certificateId]
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models and services
import Certificate from '../models/certificateModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import Package from '../models/packageModel.js';
import certificateService from '../services/certificateService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/genoun';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function testCertificateDataFlow(certificateId) {
  console.log('\n========================================');
  console.log('🧪 CERTIFICATE DATA FLOW TEST');
  console.log('========================================\n');

  // Step 1: Find certificate
  console.log('📋 Step 1: Fetching certificate...');
  const certificate = await Certificate.findById(certificateId)
    .populate('userId', 'fullName email')
    .populate('courseId', 'title description certificateSettings')
    .populate('packageId', 'name');

  if (!certificate) {
    console.error('❌ Certificate not found with ID:', certificateId);
    return false;
  }

  console.log('✅ Certificate found:', certificate.certificateNumber);
  
  // Step 2: Check raw stored values
  console.log('\n📋 Step 2: Checking stored values in certificate document...');
  console.log('   Stored studentName:', JSON.stringify(certificate.studentName));
  console.log('   Stored courseName:', JSON.stringify(certificate.courseName));
  
  const hasStoredStudentName = certificate.studentName?.ar || certificate.studentName?.en;
  const hasStoredCourseName = certificate.courseName?.ar || certificate.courseName?.en;
  
  console.log('   Has stored student name:', hasStoredStudentName ? '✅ Yes' : '❌ No');
  console.log('   Has stored course name:', hasStoredCourseName ? '✅ Yes' : '❌ No');

  // Step 3: Check populated relations
  console.log('\n📋 Step 3: Checking populated relations...');
  
  // User data
  if (certificate.userId) {
    console.log('   ✅ User populated:');
    console.log('      - ID:', certificate.userId._id);
    console.log('      - fullName.ar:', certificate.userId.fullName?.ar || '(empty)');
    console.log('      - fullName.en:', certificate.userId.fullName?.en || '(empty)');
  } else {
    console.log('   ❌ User NOT populated (userId is null or not found)');
  }

  // Course data
  if (certificate.courseId) {
    console.log('   ✅ Course populated:');
    console.log('      - ID:', certificate.courseId._id);
    console.log('      - title.ar:', certificate.courseId.title?.ar || '(empty)');
    console.log('      - title.en:', certificate.courseId.title?.en || '(empty)');
  } else {
    console.log('   ⚠️ Course NOT populated (courseId is null or not a course certificate)');
  }

  // Package data
  if (certificate.packageId) {
    console.log('   ✅ Package populated:');
    console.log('      - ID:', certificate.packageId._id);
    console.log('      - name.ar:', certificate.packageId.name?.ar || '(empty)');
    console.log('      - name.en:', certificate.packageId.name?.en || '(empty)');
  } else {
    console.log('   ⚠️ Package NOT populated (packageId is null or not a package certificate)');
  }

  // Step 4: Determine what data will be used
  console.log('\n📋 Step 4: Determining final data for PDF...');
  
  let finalStudentName = { ar: '', en: '' };
  let finalCourseName = { ar: '', en: '' };

  // Student name logic
  if (certificate.userId?.fullName) {
    finalStudentName = {
      ar: certificate.userId.fullName.ar || certificate.userId.fullName.en || '',
      en: certificate.userId.fullName.en || certificate.userId.fullName.ar || ''
    };
    console.log('   Student name source: ✅ Populated user relation');
  } else if (certificate.studentName?.ar || certificate.studentName?.en) {
    finalStudentName = certificate.studentName;
    console.log('   Student name source: ⚠️ Stored certificate value (fallback)');
  } else {
    finalStudentName = { ar: 'الطالب', en: 'Student' };
    console.log('   Student name source: ❌ Default value (no data found)');
  }

  // Course name logic
  if (certificate.courseId?.title) {
    finalCourseName = {
      ar: certificate.courseId.title.ar || certificate.courseId.title.en || '',
      en: certificate.courseId.title.en || certificate.courseId.title.ar || ''
    };
    console.log('   Course name source: ✅ Populated course relation');
  } else if (certificate.packageId?.name) {
    finalCourseName = {
      ar: certificate.packageId.name.ar || certificate.packageId.name.en || '',
      en: certificate.packageId.name.en || certificate.packageId.name.ar || ''
    };
    console.log('   Course name source: ✅ Populated package relation');
  } else if (certificate.courseName?.ar || certificate.courseName?.en) {
    finalCourseName = certificate.courseName;
    console.log('   Course name source: ⚠️ Stored certificate value (fallback)');
  } else {
    finalCourseName = { ar: 'الدورة', en: 'Course' };
    console.log('   Course name source: ❌ Default value (no data found)');
  }

  console.log('\n   📝 Final student name:', JSON.stringify(finalStudentName));
  console.log('   📝 Final course name:', JSON.stringify(finalCourseName));

  // Step 5: Verify data is valid
  console.log('\n📋 Step 5: Validating final data...');
  
  const studentNameValid = (finalStudentName.ar && finalStudentName.ar.trim()) || 
                          (finalStudentName.en && finalStudentName.en.trim());
  const courseNameValid = (finalCourseName.ar && finalCourseName.ar.trim()) || 
                         (finalCourseName.en && finalCourseName.en.trim());

  console.log('   Student name valid:', studentNameValid ? '✅ Yes' : '❌ No');
  console.log('   Course name valid:', courseNameValid ? '✅ Yes' : '❌ No');

  // Summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  
  const allPassed = studentNameValid && courseNameValid;
  
  if (allPassed) {
    console.log('✅ All checks PASSED - PDF should generate correctly');
    console.log('\n   Expected PDF content:');
    console.log(`   - Student Name (AR): ${finalStudentName.ar}`);
    console.log(`   - Student Name (EN): ${finalStudentName.en}`);
    console.log(`   - Course Name (AR): ${finalCourseName.ar}`);
    console.log(`   - Course Name (EN): ${finalCourseName.en}`);
    console.log(`   - Certificate Number: ${certificate.certificateNumber}`);
  } else {
    console.log('❌ Some checks FAILED - PDF may have missing data');
    if (!studentNameValid) {
      console.log('   ⚠️ Student name is empty - check user data');
    }
    if (!courseNameValid) {
      console.log('   ⚠️ Course name is empty - check course/package data');
    }
  }

  return allPassed;
}

async function testPDFGeneration(certificateId) {
  console.log('\n========================================');
  console.log('🖨️ PDF GENERATION TEST');
  console.log('========================================\n');

  try {
    console.log('📋 Generating PDF...');
    const { pdfBuffer, pdfUrl } = await certificateService.generateCertificatePDF(certificateId);
    
    console.log('✅ PDF generated successfully!');
    console.log('   - PDF URL:', pdfUrl);
    console.log('   - Buffer size:', pdfBuffer.length, 'bytes');
    
    return true;
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

async function listRecentCertificates() {
  console.log('\n========================================');
  console.log('📜 RECENT CERTIFICATES');
  console.log('========================================\n');

  const certificates = await Certificate.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('courseId', 'title')
    .populate('packageId', 'name')
    .select('certificateNumber courseId packageId studentName courseName createdAt');

  if (certificates.length === 0) {
    console.log('No certificates found in database.');
    return;
  }

  console.log('Available certificates to test:\n');
  certificates.forEach((cert, i) => {
    const type = cert.courseId ? 'Course' : (cert.packageId ? 'Package' : 'Unknown');
    const name = cert.courseId?.title?.ar || cert.packageId?.name?.ar || cert.courseName?.ar || '(no name)';
    console.log(`${i + 1}. ID: ${cert._id}`);
    console.log(`   Number: ${cert.certificateNumber}`);
    console.log(`   Type: ${type}`);
    console.log(`   Name: ${name}`);
    console.log(`   Created: ${cert.createdAt.toLocaleDateString()}`);
    console.log('');
  });
}

async function main() {
  await connectDB();

  const certificateId = process.argv[2];

  if (!certificateId) {
    console.log('Usage: node src/scripts/testCertificateGeneration.js <certificateId>');
    console.log('\nNo certificate ID provided. Listing recent certificates...\n');
    await listRecentCertificates();
    await mongoose.disconnect();
    return;
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(certificateId)) {
    console.error('❌ Invalid certificate ID format');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Run tests
  const dataFlowPassed = await testCertificateDataFlow(certificateId);
  
  if (dataFlowPassed) {
    console.log('\n\n🔄 Running PDF generation test...');
    const pdfPassed = await testPDFGeneration(certificateId);
    
    if (pdfPassed) {
      console.log('\n\n🎉 ALL TESTS PASSED! Certificate generation is working correctly.');
    }
  } else {
    console.log('\n\n⚠️ Skipping PDF generation test due to data flow issues.');
  }

  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
