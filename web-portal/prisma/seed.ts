import 'dotenv/config'
import { Role, VerificationStatus, CareerRecordType, InterviewOutcome, PlacementStatus, AttendanceStatus } from '@prisma/client'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding mock data...')

  await prisma.accessLog.deleteMany()
  await prisma.examRecord.deleteMany()
  await prisma.syllabusPlan.deleteMany()
  await prisma.staffRecord.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.recordAuditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.careerRecord.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.cohort.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@deeds.org',
      name: 'Super Admin',
      role: Role.ADMIN,
      status: 'ACTIVE',
    },
  })
  console.log(`Created Admin: ${admin.email}`)

  // 2. Create Teachers
  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@deeds.org',
      name: 'Jane Smith',
      role: Role.TEACHER,
      status: 'ACTIVE',
      staffRecord: {
        create: {
          department: 'Computer Science',
          designation: 'Senior Instructor'
        }
      }
    },
  })
  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@deeds.org',
      name: 'Robert Johnson',
      role: Role.TEACHER,
      status: 'ACTIVE',
    },
  })
  console.log(`Created Teachers`)

  // 3. Create Students and Profiles
  const students = []
  const baseDate = new Date()
  
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@deeds.org`,
        name: `Student Name ${i}`,
        role: Role.STUDENT,
        status: 'ACTIVE',
        profile: {
          create: {
            studentId: `DEEDS-2600${i}`,
            headline: i % 2 === 0 ? 'Aspiring Software Engineer' : 'Data Analytics Enthusiast',
            isEligibleForPlacement: i > 3,
            skills: 'JavaScript, Python, React',
            address: 'Mumbai, India',
          }
        }
      },
      include: { profile: true }
    })
    students.push(student)
  }
  console.log(`Created ${students.length} Students`)

  // 4. Create Cohorts
  await prisma.cohort.create({
    data: {
      name: 'Web Dev Batch A',
      teacherId: teacher1.id,
      students: { connect: students.slice(0, 5).map(s => ({ id: s.profile!.id })) }
    }
  })
  await prisma.cohort.create({
    data: {
      name: 'Data Science Batch B',
      teacherId: teacher2.id,
      students: { connect: students.slice(5, 10).map(s => ({ id: s.profile!.id })) }
    }
  })
  console.log(`Created Cohorts`)

  // 5. Create Attendance Records
  const attendanceRecords = []
  for (const student of students) {
    for (let d = 1; d <= 15; d++) {
      const date = new Date()
      date.setDate(date.getDate() - d)
      
      let status: AttendanceStatus = AttendanceStatus.PRESENT
      let notes = null
      
      const rand = Math.random()
      if (rand > 0.8 && rand < 0.9) status = AttendanceStatus.ABSENT
      else if (rand >= 0.9 && rand < 0.95) status = AttendanceStatus.LATE
      else if (rand >= 0.95) {
        status = AttendanceStatus.LEAVE
        notes = "Medical leave"
      }
      
      attendanceRecords.push({
        userId: student.id,
        date,
        status,
        notes,
        classOrEvent: 'Regular Class'
      })
    }
  }
  await prisma.attendance.createMany({ data: attendanceRecords })
  console.log(`Created Attendance records`)

  // 6. Create Career Records
  // Interviews
  await prisma.careerRecord.create({
    data: {
      profileId: students[0].profile!.id,
      recordType: CareerRecordType.INTERVIEW,
      company: 'TechCorp',
      role: 'Frontend Dev',
      interviewStatus: InterviewOutcome.SCHEDULED,
      createdAt: new Date()
    }
  })
  await prisma.careerRecord.create({
    data: {
      profileId: students[1].profile!.id,
      recordType: CareerRecordType.INTERVIEW,
      company: 'DataSys',
      role: 'Analyst',
      interviewStatus: InterviewOutcome.OFFER_EXTENDED,
      createdAt: new Date(new Date().setDate(new Date().getDate() - 5))
    }
  })
  
  // Placements / Alumni
  for (let i = 2; i <= 5; i++) {
    const isAlumni = i > 3; // Make some alumni from previous years
    const startDate = isAlumni 
      ? new Date(baseDate.getFullYear() - (i - 2), 5, 1) 
      : new Date();
      
    await prisma.careerRecord.create({
      data: {
        profileId: students[i].profile!.id,
        recordType: CareerRecordType.PLACEMENT,
        company: ['Infosys', 'TCS', 'Wipro', 'TechMahindra'][i-2],
        role: 'Software Engineer',
        placementStatus: PlacementStatus.WORKING,
        startDate: startDate,
        salary: 400000 + (i * 50000),
        verification: VerificationStatus.VERIFIED
      }
    })
  }
  console.log(`Created Career/Alumni records`)
  
  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
