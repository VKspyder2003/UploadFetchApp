const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const port = process.env.PORT || 3000

// Enable CORS for all routes
app.use(cors())

// Set up multer storage
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })

// Set up static serving of uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Defining route for file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File not uploaded.' })
  }

  const fileInfo = {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    filename: req.file.filename,
    path: req.file.path
  }

  res.json({ message: 'File uploaded successfully.', fileInfo })
})

// Defining route to get information about uploaded files
app.get('/files', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read files.' })
    }

    const fileInfos = files.map(filename => {
      const filePath = path.join('uploads', filename)
      const stats = fs.statSync(filePath)

      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime
      }
    })

    res.json({ files: fileInfos })
  })
})

// Defining route to get information about a specific uploaded file
app.get('/file/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.join('uploads', filename)

  try {
    const stats = fs.statSync(filePath)

    const fileInfo = {
      filename,
      size: stats.size,
      createdAt: stats.birthtime
    }

    res.json({ fileInfo })
  } catch (err) {
    res.status(404).json({ error: 'File not found.' })
  }
})

// Defining route to get content of the file in case of a text file
app.get('/file/content/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(__dirname, 'uploads', filename)

  fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read file content.' })
    }

    res.send(content)
  })
})

// Starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
