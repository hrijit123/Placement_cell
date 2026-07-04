// Seed script for local development / demo data.
// Run with: node --env-file=.env prisma/seed.mjs
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30000, keepAlive: true });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // --- Staff ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@islconnect.org' },
    update: { role: 'ADMIN' },
    create: { email: 'admin@islconnect.org', name: 'NGO Admin', role: 'ADMIN' },
  });

  const teacherAsha = await prisma.user.upsert({
    where: { email: 'asha.teacher@islconnect.org' },
    update: { role: 'TEACHER' },
    create: { email: 'asha.teacher@islconnect.org', name: 'Asha Nair', role: 'TEACHER' },
  });

  const teacherVikram = await prisma.user.upsert({
    where: { email: 'vikram.teacher@islconnect.org' },
    update: { role: 'TEACHER' },
    create: { email: 'vikram.teacher@islconnect.org', name: 'Vikram Rao', role: 'TEACHER' },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: 'hr@techcorp.example.com' },
    update: { role: 'RECRUITER' },
    create: { email: 'hr@techcorp.example.com', name: 'Meera Iyer (TechCorp HR)', role: 'RECRUITER' },
  });

  // --- Students with profiles ---
  async function upsertStudent({ email, name, studentId, profile }) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'STUDENT' },
      create: { email, name, role: 'STUDENT' },
    });
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { studentId, ...profile },
      create: { userId: user.id, studentId, ...profile },
    });
    return user;
  }

  const ravi = await upsertStudent({
    email: 'ravi.student@example.com',
    name: 'Ravi Kumar',
    studentId: 'ISL-2024-001',
    profile: {
      headline: 'Frontend Developer | ISL Native Signer',
      address: 'Salt Lake, Kolkata, West Bengal',
      languages: 'ISL, Written English, Written Hindi',
      hobbies: 'Photography, Chess',
      vocation: 'Web Development (NGO Batch 2024)',
      disabilityInfo: 'Profoundly deaf since birth. Prefers ISL interpreter for interviews; comfortable with written chat.',
      skills: 'HTML, CSS, JavaScript, React, Figma',
      education: 'B.Com, Calcutta University (2022)',
      courseworks: 'Web Development Bootcamp (6 months, ISL Connect NGO)',
      internships: 'UI Intern at LocalShop (3 months)',
      certifications: 'freeCodeCamp Responsive Web Design',
      expectedSalary: '3.5 LPA',
      availability: 'Full-time, Immediate',
    },
  });

  const priya = await upsertStudent({
    email: 'priya.student@example.com',
    name: 'Priya Sharma',
    studentId: 'ISL-2024-002',
    profile: {
      headline: 'Data Entry & Office Administration',
      address: 'Howrah, West Bengal',
      languages: 'ISL, Written English',
      vocation: 'Office Administration (NGO Batch 2024)',
      disabilityInfo: 'Hard of hearing; uses hearing aid. Can lip-read Hindi and English.',
      skills: 'MS Excel, Tally, Typing (45 WPM)',
      education: 'Higher Secondary, WBCHSE (2021)',
      expectedSalary: '2.4 LPA',
      availability: 'Full-time',
    },
  });

  const arjun = await upsertStudent({
    email: 'arjun.student@example.com',
    name: 'Arjun Verma',
    studentId: 'ISL-2023-015',
    profile: {
      headline: 'Graphic Designer',
      address: 'New Town, Kolkata',
      languages: 'ISL, Written English',
      vocation: 'Graphic Design (NGO Batch 2023)',
      disabilityInfo: 'Profoundly deaf. ISL only; requires interpreter.',
      skills: 'Photoshop, Illustrator, Canva',
      education: 'Diploma in Design (2020)',
      expectedSalary: '3 LPA',
      availability: 'Full-time',
    },
  });

  // --- Cohorts ---
  const raviProfile = await prisma.profile.findUnique({ where: { studentId: 'ISL-2024-001' } });
  const priyaProfile = await prisma.profile.findUnique({ where: { studentId: 'ISL-2024-002' } });
  const arjunProfile = await prisma.profile.findUnique({ where: { studentId: 'ISL-2023-015' } });

  const existingCohortA = await prisma.cohort.findFirst({ where: { name: 'Batch 2024 - Web Development' } });
  const cohortA = existingCohortA ?? await prisma.cohort.create({
    data: {
      name: 'Batch 2024 - Web Development',
      description: 'Six-month vocational web development program',
      teacherId: teacherAsha.id,
      students: { connect: [{ id: raviProfile.id }, { id: priyaProfile.id }] },
    },
  });

  const existingCohortB = await prisma.cohort.findFirst({ where: { name: 'Batch 2023 - Design' } });
  if (!existingCohortB) {
    await prisma.cohort.create({
      data: {
        name: 'Batch 2023 - Design',
        description: 'Graphic design vocational program',
        teacherId: teacherVikram.id,
        students: { connect: [{ id: arjunProfile.id }] },
      },
    });
  }

  // --- Jobs ---
  const jobCount = await prisma.job.count();
  let jobs = [];
  if (jobCount === 0) {
    jobs = await Promise.all([
      prisma.job.create({ data: { title: 'Junior Frontend Developer', description: 'React/TypeScript role. Deaf-friendly workplace with ISL-fluent team lead.', company: 'TechCorp Solutions', location: 'Kolkata (Hybrid)', recruiterId: recruiter.id } }),
      prisma.job.create({ data: { title: 'Data Entry Operator', description: 'Back-office data processing. Written-communication-first team.', company: 'FinServe Ltd', location: 'Kolkata', recruiterId: recruiter.id } }),
      prisma.job.create({ data: { title: 'Graphic Design Associate', description: 'Marketing collateral design for e-commerce brand.', company: 'ShopKart', location: 'Remote', recruiterId: recruiter.id } }),
    ]);
  } else {
    jobs = await prisma.job.findMany({ take: 3 });
  }

  // --- Applications (idempotent-ish: only create if student has none) ---
  if (await prisma.jobApplication.count({ where: { studentId: ravi.id } }) === 0) {
    await prisma.jobApplication.create({
      data: { jobId: jobs[0].id, studentId: ravi.id, status: 'OFFER_ACCEPTED', offeredSalary: 380000, notes: 'Strong portfolio; interviewer impressed with React knowledge.' },
    });
    await prisma.jobApplication.create({
      data: { jobId: jobs[1].id, studentId: ravi.id, status: 'REJECTED_BY_COMPANY', rejectionReason: 'Role required phone-based client coordination; company unwilling to restructure the role.' },
    });
  }
  if (await prisma.jobApplication.count({ where: { studentId: priya.id } }) === 0) {
    await prisma.jobApplication.create({
      data: { jobId: jobs[1].id, studentId: priya.id, status: 'INTERVIEW_SCHEDULED' },
    });
  }
  if (await prisma.jobApplication.count({ where: { studentId: arjun.id } }) === 0) {
    await prisma.jobApplication.create({
      data: { jobId: jobs[2].id, studentId: arjun.id, status: 'OFFER_EXTENDED', offeredSalary: 300000 },
    });
  }

  // --- Career history for Ravi (2 records) ---
  if (await prisma.careerPlacement.count({ where: { userId: ravi.id } }) === 0) {
    await prisma.careerPlacement.create({
      data: { userId: ravi.id, company: 'LocalShop', role: 'UI Intern', salary: 120000, startDate: new Date('2024-01-15'), endDate: new Date('2024-04-15'), status: 'RESIGNED', nextMove: 'Joined TechCorp Solutions full-time' },
    });
    await prisma.careerPlacement.create({
      data: { userId: ravi.id, company: 'TechCorp Solutions', role: 'Junior Frontend Developer', salary: 380000, startDate: new Date('2025-07-01'), status: 'WORKING' },
    });
  }

  // --- Attendance for Ravi (10 records, to exercise pagination) ---
  if (await prisma.attendance.count({ where: { userId: ravi.id } }) === 0) {
    const statuses = ['PRESENT', 'PRESENT', 'LATE', 'PRESENT', 'ABSENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT'];
    for (let i = 0; i < 10; i++) {
      const d = new Date('2026-06-01');
      d.setDate(d.getDate() + i * 2);
      await prisma.attendance.create({
        data: { userId: ravi.id, date: d, status: statuses[i], classOrEvent: i % 3 === 0 ? 'Placement Prep Workshop' : 'Web Dev Class' },
      });
    }
  }

  console.log('Seed complete.');
  console.log('Admin:', admin.email, '| Teacher A (Web Dev cohort):', teacherAsha.email, '| Teacher B (Design cohort):', teacherVikram.email);
  console.log('Students: ISL-2024-001 (Ravi), ISL-2024-002 (Priya), ISL-2023-015 (Arjun)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
