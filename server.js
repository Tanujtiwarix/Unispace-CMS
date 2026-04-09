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
      res.json({ success: true, name: data[0].name, section: data[0].section})
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
        result[row.day][row.lecture] =
          row.subjects.subject_name + " (" + row.subjects.teacher_name + ")"
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

app.listen(3000, () => {
  console.log('Server running on port 3000')
})