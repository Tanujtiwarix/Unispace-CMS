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
    const { id, password } = req.body

    console.log(id, password)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', id)
      .eq('password', password)

    if (error) {
      console.error(error)
      return res.status(500).json({ success: false })
    }

    if (data.length > 0) {
      res.json({ success: true })
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