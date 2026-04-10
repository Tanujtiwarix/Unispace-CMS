import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))

app.use(express.json())

import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.url,
  process.env.key
)

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
    const { section } = req.query

    if (!section) {
      section = 'A';
    }

    // 🔥 JOIN timetable + subjects
    const { data, error } = await supabase
      .from('timetable')
      .select(`
        day,
        lecture,
        subject_code,
        subjects (
          subject_name,
          teacher_name
        )
      `)
      .eq('section', section)

    if (error) throw error

    // Convert to grid
    const result = {}

    data.forEach(row => {
      if (!result[row.day]) result[row.day] = {}

      if (row.subjects) {
        result[row.day][row.lecture] = {
          subject: row.subjects.subject_name,
          teacher: row.subjects.teacher_name
        }

      } else {
        result[row.day][row.lecture] = null
      }
    })

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
    const today = days[now.getDay()]

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
    let currentLecture = null

    for (let i = 0; i < timeSlots.length; i++) {
      const [start, end] = timeSlots[i]

      const [sh, sm] = start.split(":").map(Number)
      const [eh, em] = end.split(":").map(Number)

      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        currentLecture = i + 1
        break
      }
    }

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
      .from('room_usage')
      .select('room_code')
      .eq('day', today)
      .eq('lecture', currentLecture)

    if (err1) throw err1

    // 🔥 2. GET ALL ROOMS
    const { data: allRooms, error: err2 } = await supabase
      .from('rooms')
      .select('room_code')

    if (err2) throw err2

    const occupiedSet = new Set(
      occupied.map(r => r.room_code.trim())
    )

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


app.listen(3000, () => {
  console.log('Server running on port 3000')
})