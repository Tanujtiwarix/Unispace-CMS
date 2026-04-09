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
      res.json({ success: true, name: data[0].name })
      console.log(data)
    } else {
      res.json({ success: false })
    }

  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})