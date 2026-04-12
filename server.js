import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import path from "path";
import { fileURLToPath } from 'url';
import http from "http"
import { Server } from "socket.io"



const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "*" }
})
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))

app.use(express.json())

import dotenv from 'dotenv'
dotenv.config()




const supabase = createClient(
  process.env.urls,
  process.env.key
)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
})

app.get("/student", (req, res) => {
  res.sendFile(path.join(__dirname, "student.html"));
})

app.get("/faculty", (req, res) => {
  res.sendFile(path.join(__dirname, "faculty.html"));
})




function getCurrentLecture() {
  const timeSlots = [
    ["09:10", "10:00"],
    ["10:05", "10:55"],
    ["11:00", "11:50"],
    ["11:50", "12:40"],
    ["12:40", "13:30"],
    ["13:30", "14:20"],
    ["14:20", "15:10"],
    ["15:10", "16:00"]
  ]

  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()

  for (let i = 0; i < timeSlots.length; i++) {
    const [s, e] = timeSlots[i]
    const [sh, sm] = s.split(":").map(Number)
    const [eh, em] = e.split(":").map(Number)

    const start = sh * 60 + sm
    const end = eh * 60 + em

    if (minutes >= start && minutes <= end) return i + 1
  }

  return null
}




app.post('/login', async (req, res) => {
  try {
    const { id, password, role } = req.body

    console.log("Login:", id, password, role)

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('rollno', id)
      .eq('password', password)
      .eq('role', role)


    if (error) {
      console.error(error)
      return res.status(500).json({ success: false })
    }

    if (data.length > 0) {
      res.json({ success: true, name: data[0].name, section: data[0].section })
      console.log(data)
    } else {
      res.json({ success: false })
    }

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

app.get('/timetable', async (req, res) => {
  try {
    let { section } = req.query
    if (!section) section = 'A'

    // 🔥 1. GET TIMETABLE
    const { data, error } = await supabase
      .from('timetable')
      .select(`
        day,
        lecture,
        subject_code,
        room,
        section,
        subjects (
          subject_name,
          teacher_name
        )
      `)
      .eq('section', section)

    if (error) throw error

    // 🧠 2. BUILD BASE RESULT FIRST
    const result = {}

    data.forEach(row => {
      if (!result[row.day]) result[row.day] = {}

      if (row.subjects) {
        result[row.day][row.lecture] = {
          subject: row.subjects.subject_name,
          teacher: row.subjects.teacher_name,
          room: row.room,
          section: row.section
        }
      } else {
        result[row.day][row.lecture] = null
      }
    })

    // 🧠 3. GET WEEK MAP
    // const weekMap = getWeekDates()

    // 🔥 4. FETCH EVENTS
    // const { data: events = [] } = await supabase
    //   .from("class_events")
    //   .select("*")
    //   .eq("section", section)

    // // 🟥 APPLY CANCELS
    // events
    //   .filter(e => e.type === "cancel")
    //   .forEach(e => {

    //     const day = Object.keys(weekMap).find(d => {
    //       const mapDate = new Date(weekMap[d]).toISOString().split("T")[0]
    //       const eventDate = new Date(e.date).toISOString().split("T")[0]
    //       return mapDate === eventDate
    //     })

    //     if (!day) return

    //     if (!result[day]) result[day] = {}

    //     // 🔥 ADD GLOBAL FLAG
    //     if (!result[day][e.lecture]) result[day][e.lecture] = {}

    //     result[day][e.lecture].globalCancelled = true
    //   })

    // // 🟣 APPLY EXTRAS
    // events
    //   .filter(e => e.type === "extra")
    //   .forEach(e => {

    //     const day = Object.keys(weekMap).find(
    //       d => weekMap[d] === e.extra_date
    //     )

    //   if (!day) return

    //   if (!result[day]) result[day] = {}

    //   for (let i = e.start_lecture; i <= e.end_lecture; i++) {
    //     result[day][i] = {
    //       subject: e.subject_code,
    //       teacher: e.faculty_name,
    //       room: e.room_code,
    //       section: e.section,
    //       isExtra: true
    //     }
    //   }
    // })

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/free-rooms', async (req, res) => {
  try {
    const now = new Date()

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    // const today = days[now.getDay()]
    const today = "Monday"

    const timeSlots = [
      ["09:10", "10:00"],
      ["10:05", "10:55"],
      ["11:00", "11:50"],
      ["11:50", "12:40"],
      ["12:40", "13:30"],
      ["13:30", "14:20"],
      ["14:20", "15:10"],
      ["15:10", "16:00"]
    ]

    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    let currentLecture = 4

    // let currentLecture = null

    // for (let i = 0; i < timeSlots.length; i++) {
    //   const [start, end] = timeSlots[i]

    //   const [sh, sm] = start.split(":").map(Number)
    //   const [eh, em] = end.split(":").map(Number)

    //   const startMin = sh * 60 + sm
    //   const endMin = eh * 60 + em

    //   if (currentMinutes >= startMin && currentMinutes <= endMin) {
    //     currentLecture = i + 1
    //     break
    //   }
    // }

    // ❗ If no class currently running
    if (!currentLecture) {
      const { data: allRooms } = await supabase
        .from('rooms')
        .select('room_code')

      return res.json({
        success: true,
        freeRooms: allRooms
      })
    }

    // 🔥 1. GET OCCUPIED ROOMS
    const { data: occupied, error: err1 } = await supabase
      .from('timetable')
      .select('room')
      .eq('day', today)
      .eq('lecture', currentLecture)
      .not('room', 'is', null)

    // 🔥 ALSO GET BOOKED ROOMS
    const { data: booked } = await supabase
      .from('room_bookings')
      .select('room_code, start_lecture, end_lecture')
      .eq('day', today)

    const activeBooked = booked.filter(b =>
      currentLecture >= b.start_lecture &&
      currentLecture <= b.end_lecture
    )

    if (err1) throw err1

    // 🔥 2. GET ALL ROOMS
    const { data: allRooms, error: err2 } = await supabase
      .from('rooms')
      .select('room_code')

    if (err2) throw err2

    const occupiedSet = new Set([
      ...occupied.map(r => r.room?.trim()),
      ...activeBooked.map(r => r.room_code?.trim())
    ])

    // 🔥 3. FILTER FREE ROOMS
    const freeRooms = allRooms.filter(
      r => !occupiedSet.has(r.room_code.trim())
    )

    res.json({
      success: true,
      day: today,
      lecture: currentLecture,
      freeRooms
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})


app.post('/book-room', async (req, res) => {
  try {
    const { room_code, day, start_lecture, end_lecture, booked_by, purpose } = req.body

    // 🔥 Check if already booked
    const { data: existing } = await supabase
      .from('room_bookings')
      .select('*')
      .eq('room_code', room_code)
      .eq('day', day)


    if (existing.length > 0) {
      return res.json({ success: false, message: "Room already booked" })
    }

    // 🔥 CHECK TIMETABLE CONFLICT
    const { data: clash1 } = await supabase
      .from('timetable')
      .select('*')
      .eq('day', day)
      .eq('room', room_code)
      .gte('lecture', start_lecture)
      .lte('lecture', end_lecture)

    // 🔥 CHECK BOOKING CONFLICT
    const { data: clash2 } = await supabase
      .from('room_bookings')
      .select('*')
      .eq('day', day)
      .eq('room_code', room_code)
      .or(`and(start_lecture.lte.${end_lecture},end_lecture.gte.${start_lecture})`)

    if (clash1.length > 0 || clash2.length > 0) {
      return res.json({ success: false, message: "Time slot already occupied" })
    }

    // 🔥 Insert booking
    const { error } = await supabase
      .from('room_bookings')
      .insert([{
        room_code,
        day,
        start_lecture,
        end_lecture,
        booked_by,
        purpose
      }])

    if (error) throw error

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

app.get('/my-bookings', async (req, res) => {
  const { data } = await supabase
    .from('room_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  res.json(data)
})


app.get('/available-slots', async (req, res) => {
  try {
    const { room_code, day } = req.query

    const totalSlots = [1, 2, 3, 4, 5, 6, 7, 8]

    // 🔥 GET TIMETABLE OCCUPIED
    const { data: tt } = await supabase
      .from('timetable')
      .select('lecture')
      .eq('day', day)
      .eq('room', room_code)

    // 🔥 GET BOOKED
    const { data: bookings } = await supabase
      .from('room_bookings')
      .select('start_lecture, end_lecture')
      .eq('day', day)
      .eq('room_code', room_code)

    const occupied = new Set()

    // timetable slots
    tt.forEach(r => occupied.add(r.lecture))

    // booking slots
    bookings.forEach(b => {
      for (let i = b.start_lecture; i <= b.end_lecture; i++) {
        occupied.add(i)
      }
    })

    // 🔥 FIND FREE CONTINUOUS SLOTS
    const freeRanges = []
    let start = null

    for (let i = 1; i <= 8; i++) {
      if (!occupied.has(i)) {
        if (start === null) start = i
      } else {
        if (start !== null) {
          for (let j = start; j <= i - 1; j += 2) {
            freeRanges.push([j, Math.min(j + 1, i - 1)])
          }
          start = null
        }
      }
    }

    // handle last range
    if (start !== null) {
      for (let j = start; j <= 8; j += 2) {
        freeRanges.push([j, Math.min(j + 1, 8)])
      }
    }

    res.json({ success: true, slots: freeRanges })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// Faculty

app.post('/faclogin', async (req, res) => {
  try {
    const { id, password, role } = req.body

    console.log("Login:", id, password, role)

    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .eq('rollno', id)
      .eq('password', password)
      .eq('role', role)


    if (error) {
      console.error(error)
      return res.status(500).json({ success: false })
    }

    if (data.length > 0) {
      res.json({ success: true, name: data[0].name, section: data[0].section })
      console.log(data)
    } else {
      res.json({ success: false })
    }

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})


app.get('/faculty-timetable', async (req, res) => {
  try {
    const { teacher } = req.query

    // 🔥 1. GET TIMETABLE
    const { data: timetableData, error: err1 } = await supabase
      .from('timetable')
      .select('*')

    if (err1) throw err1

    // 🔥 2. GET SUBJECTS
    const { data: subjectData, error: err2 } = await supabase
      .from('subjects')
      .select('*')

    if (err2) throw err2

    // 🔥 3. MAP SUBJECTS
    const subjectMap = {}
    subjectData.forEach(s => {
      subjectMap[s.subject_code] = s
    })

    // 🔥 4. FILTER + BUILD RESULT
    const result = {}

    timetableData.forEach(row => {
      const subject = subjectMap[row.subject_code]

      if (!subject) return

      if (subject.teacher_name !== teacher) return

      if (!result[row.day]) result[row.day] = {}

      result[row.day][row.lecture] = {
        subject: subject.subject_name,
        section: row.section,
        room: row.room || "—",
        subject_code: row.subject_code
      }
    })

    res.json(result)



  } catch (err) {
    console.error("FACULTY TT ERROR:", err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/faculty-book-room', async (req, res) => {
  try {
    const { room_code, day, start_lecture, end_lecture, faculty_name, purpose } = req.body

    // same conflict logic as student
    const { data: clash } = await supabase
      .from('room_bookings')
      .select('*')
      .eq('room_code', room_code)
      .eq('day', day)
      .or(`and(start_lecture.lte.${end_lecture},end_lecture.gte.${start_lecture})`)

    if (clash.length > 0) {
      return res.json({ success: false, message: "Room already occupied" })
    }

    await supabase.from('room_bookings').insert([{
      room_code,
      day,
      start_lecture,
      end_lecture,
      booked_by: faculty_name,
      purpose: "Purpose: " + purpose
    }])

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})




// 
// 
// 
// 
// 
// 
// attendance

let activeTokens = new Set()

app.get('/generate-attendance-token', (req, res) => {
  const { subject_code, lecture } = req.query

  const token = Buffer.from(
    JSON.stringify({
      subject_code,
      lecture,
      id: Math.random().toString(36).slice(2) // 🔥 unique
    })
  ).toString('base64')

  activeTokens.add(token)

  res.json({ token })
})

let attendance = []
let scannedStudents = new Set()



io.on("connection", socket => {
  console.log("Client connected ⚡")

  // send existing data when faculty joins
  socket.emit("initial-data", attendance)
})


app.post('/mark-attendance', async (req, res) => {
  try {
    const { token, student_id } = req.body

    if (!token || !student_id) {
      return res.json({ success: false, message: "Missing data" })
    }

    if (!activeTokens.has(token)) {
      return res.json({ success: false, message: "QR expired ❌" })
    }

    // ✅ DECODE FIRST
    let decoded
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch (e) {
      return res.json({ success: false, message: "Invalid QR" })
    }

    const subject_code = decoded.subject_code
    const lecture = Number(decoded.lecture)
    const day = "Monday"


    // ✅ NOW use it safely
    const { data: student } = await supabase
      .from('students')
      .select('section')
      .eq('rollno', student_id)
      .single()

    const { data: lectureData } = await supabase
      .from('timetable')
      .select('*')
      .eq('lecture', lecture)
      .eq('subject_code', subject_code)
      .eq('day', day)
      .eq('section', student.section)

    if (!lectureData || lectureData.length === 0) {
      return res.json({ success: false, message: "Invalid lecture ❌" })
    }

    console.log(student.section);
    console.log(lectureData[0]?.section);

    if (!student || student.section !== lectureData[0]?.section) {
      return res.json({ success: false, message: "Wrong class ❌" })
    }



    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', student_id)
      .eq('subject_code', subject_code)
      .eq('day', day)
      .eq('lecture', lecture)

    console.log("TOKEN DATA:", decoded)
    console.log("QUERY:", subject_code, lecture)

    if (existing && existing.length > 0) {
      return res.json({ success: false, message: "Already marked" })
    }

    const { error } = await supabase
      .from('attendance')
      .insert([{ student_id, subject_code, day, lecture }])

    if (error) {
      console.error(error)
      return res.json({ success: false })
    }

    // ✅ delete token AFTER success
    activeTokens.delete(token)



    const { data: stname } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', student_id)

    // const entry = {
    //   student_id,
    //   students: {
    //     name: stname[0]?.name || "Unknown"
    //   }
    // }

    attendance.push(entry)
    scannedStudents.add(student_id)

    // 🔥 REAL-TIME EMIT
    io.emit("new-attendance", entry)

    res.json({ success: true })

  } catch (err) {
    console.error("ATTENDANCE ERROR:", err)
    res.status(500).json({ success: false })
  }
})


app.post("/refresh-attendance", async (req, res) => {
  try {
    const { subject_code, lecture } = req.body
    const day = "Monday" // or dynamic

    if (!subject_code || !lecture) {
      return res.json({ success: false, message: "Missing filter" })
    }

    // 🔥 ONLY CURRENT SESSION DATA
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        student_id,
        marked_at,
        students (
          name
        )
      `)
      .eq("subject_code", subject_code)
      .eq("lecture", lecture)
      .eq("day", day)
      .order("marked_at", { ascending: false })

    if (error) {
      console.error(error)
      return res.json({ success: false })
    }

    // reset memory
    attendance = []
    scannedStudents.clear()

    data.forEach(r => {
      attendance.push(r)
      scannedStudents.add(r.student_id)
    })

    io.emit("reset")
    io.emit("initial-data", attendance)

    res.json({ success: true, data })

  } catch (err) {
    console.error(err)
    res.json({ success: false })
  }
})

app.get('/faculty-active-bookings', async (req, res) => {
  try {
    const { name } = req.query

    const { data } = await supabase
      .from('room_bookings')
      .select('*')
      .eq('booked_by', name)
      .order('created_at', { ascending: false })
      .limit(1)

    res.json(data[0] || null)

  } catch (err) {
    console.error(err)
    res.status(500).json(null)
  }
})

app.post("/post-announcement", async (req, res) => {
  try {
    const { message, section, faculty_name } = req.body

    const { error } = await supabase
      .from("announcements")
      .insert([{
        message,
        section,
        faculty_name
      }])

    if (error) throw error

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.json({ success: false })
  }
})

app.get("/announcements", async (req, res) => {
  const { section } = req.query

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("section", section)
    .order("created_at", { ascending: false })

  res.json(data)
})

app.get("/attendance-history", async (req, res) => {
  try {
    const { student_id } = req.query

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", student_id)
      .order("marked_at", { ascending: false })

    if (error) throw error

    res.json(data)

  } catch (err) {
    console.error(err)
    res.json([])
  }
})

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()

  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  const map = {}

  days.forEach((d, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)

    map[d] = date.toISOString().split("T")[0] // YYYY-MM-DD
  })

  return map
}

function getDateForDay(day) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const today = new Date()
  let todayIndex = today.getDay()
  const targetIndex = days.indexOf(day)

  // 🔥 FIX: if today is Sunday, shift to next week
  if (todayIndex === 0) {
    todayIndex = 7
  }

  let diff = targetIndex - todayIndex

  if (diff <= 0) {
    diff += 7
  }

  const result = new Date()
  result.setDate(today.getDate() + diff)

  return result.toISOString().split("T")[0]
}

app.post('/cancel-class', async (req, res) => {
  try {
    const { section, day, lecture, faculty_name } = req.body

    const date = getDateForDay(day)


    console.log("📥 CANCEL:", { section, day, lecture })

    // 🔍 exact match (NO ambiguity now)
    const { data: exists } = await supabase
      .from('timetable')
      .select('*')
      .eq('section', section)
      .eq('day', day)
      .eq('lecture', lecture)

    console.log("📊 MATCH:", exists)

    if (!exists || exists.length === 0) {
      return res.json({ success: false, message: "Class not found" })
    }

    const subject_code = exists[0].subject_code

    // ❌ prevent duplicate cancel
    const { data: already = [] } = await supabase
      .from('class_events')
      .select('*')
      .eq('type', 'cancel')
      .eq('section', section)
      .eq('date', date)
      .eq('lecture', lecture)

    if (already.length > 0) {
      return res.json({ success: false, message: "Already cancelled" })
    }

    // ✅ insert
    await supabase.from('class_events').insert([{
      type: 'cancel',
      section,
      subject_code,
      faculty_name,
      date,
      lecture
    }])

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

app.post('/add-extra-class', async (req, res) => {
  try {
    const {
      section,
      subject_code,
      faculty_name,
      day,
      start_lecture,
      end_lecture,
      room_code,
      purpose
    } = req.body

    const weekMap = getDateForDay()
    const extra_date = weekMap[day]

    const today = new Date().toISOString().split("T")[0]

    // ❌ must be future
    if (extra_date <= today) {
      return res.json({ success: false, message: "Only future dates allowed" })
    }

    // 🔍 check clash with timetable
    const { data: clash1 } = await supabase
      .from('timetable')
      .select('*')
      .eq('section', section)
      .eq('day', day)
      .gte('lecture', start_lecture)
      .lte('lecture', end_lecture)

    if (clash1.length > 0) {
      return res.json({ success: false, message: "Slot already has class" })
    }

    // 🔍 check clash with other extras
    const { data: clash2 } = await supabase
      .from('class_events')
      .select('*')
      .eq('type', 'extra')
      .eq('section', section)
      .eq('extra_date', extra_date)

    const overlap = clash2.some(e =>
      !(end_lecture < e.start_lecture || start_lecture > e.end_lecture)
    )

    if (overlap) {
      return res.json({ success: false, message: "Extra class conflict" })
    }

    // ✅ insert
    await supabase.from('class_events').insert([{
      type: 'extra',
      section,
      subject_code,
      faculty_name,
      extra_date,
      start_lecture,
      end_lecture,
      room_code,
      purpose
    }])

    res.json({ success: true })
    io.emit("timetable:update", {
      type: "extra",
      section
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})
app.get('/attendance-summary', async (req, res) => {
  try {
    const { student_id, section } = req.query

    if (!student_id || !section) {
      return res.json({ error: "Missing data" })
    }

    // 📅 TODAY
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long'
    })

    // 🔥 GET TIMETABLE (TOTAL LECTURES)
    const { data: timetable = [] } = await supabase
      .from('timetable')
      .select('*')
      .eq('section', section)

    // 🔥 GET ALL ATTENDANCE
    const { data: attendance = [] } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', student_id)

    // 🧠 SUBJECT STATS
    const subjectStats = {}

    // TOTAL
    timetable.forEach(t => {
      if (!t.subject_code) return

      if (!subjectStats[t.subject_code]) {
        subjectStats[t.subject_code] = { total: 0, attended: 0 }
      }

      subjectStats[t.subject_code].total++
    })

    // ATTENDED
    attendance.forEach(a => {
      if (!a.subject_code) return

      if (!subjectStats[a.subject_code]) {
        subjectStats[a.subject_code] = { total: 0, attended: 0 }
      }

      subjectStats[a.subject_code].attended++
    })

    // 🔥 DAILY (QR)
    const todayAttendance = attendance.filter(a => a.day === today)

    res.json({
      overall: subjectStats,
      daily: todayAttendance
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})
app.get('/defaulters', async (req, res) => {
  try {
    const { section } = req.query

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('section', section)

    const results = []

    for (const s of students) {

      const r = await fetch(`http://localhost:3000/attendance-summary?student_id=${s.student_id}&section=${section}`)
      const data = await r.json()

      Object.keys(data).forEach(sub => {
        if (data[sub].percentage < 75) {
          results.push({
            student_id: s.student_id,
            name: s.name,
            subject: sub,
            percentage: data[sub].percentage
          })
        }
      })
    }

    res.json(results)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed" })
  }
})

app.get("/subjects", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("subject_code, subject_name")

    if (error) {
      console.error(error)
      return res.status(500).json({ error: "Failed to fetch subjects" })
    }

    res.json(data)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

server.listen(3000, () => {
  console.log('Server running on port 3000')
})