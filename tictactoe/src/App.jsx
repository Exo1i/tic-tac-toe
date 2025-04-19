import { useEffect, useRef, useState } from 'react'

// Load OpenCV.js from CDN (teckstark build)
const OPENCV_URL = 'https://cdn.jsdelivr.net/npm/@teckstark/opencv-js@4.7.0/opencv.js'
const ESP32_ENDPOINT = 'http://esp32.local/move' // Change to your ESP32 endpoint

function loadOpenCv(onload) {
  if (window.cv) {
    onload()
    return
  }
  const script = document.createElement('script')
  script.src = OPENCV_URL
  script.async = true
  script.onload = () => {
    window.cv['onRuntimeInitialized'] = onload
  }
  document.body.appendChild(script)
}

function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cvReady, setCvReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [move, setMove] = useState(null)
  const [angles, setAngles] = useState(null)
  const [esp32Response, setEsp32Response] = useState(null)

  // Load OpenCV.js
  useEffect(() => {
    loadOpenCv(() => setCvReady(true))
  }, [])

  // Start camera
  useEffect(() => {
    if (!cvReady) return
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream
    })
  }, [cvReady])

  // Process frame every 2 seconds
  useEffect(() => {
    if (!cvReady) return
    let interval
    function process() {
      if (!videoRef.current || !canvasRef.current) return
      setProcessing(true)
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      let src = new window.cv.Mat(canvas.height, canvas.width, window.cv.CV_8UC4)
      let dst = new window.cv.Mat()
      window.cv.imshow(canvas, src)
      src.delete()
      dst.delete()
      // ...existing code for board detection and move recognition...
      // For demo, simulate a move and angles:
      const detectedMove = Math.floor(Math.random() * 9)
      const detectedAngles = { servo1: 120, servo2: 90, servo3: 150 }
      setMove(detectedMove)
      setAngles(detectedAngles)
      setProcessing(false)
    }
    interval = setInterval(process, 2000)
    return () => clearInterval(interval)
  }, [cvReady])

  // Send move to ESP32 when angles change
  useEffect(() => {
    if (!angles) return
    fetch(ESP32_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(angles)
    })
      .then(res => res.text())
      .then(setEsp32Response)
      .catch(e => setEsp32Response('Error: ' + e.message))
  }, [angles])

  return (
    <div>
      <h1>Tic-Tac-Toe with OpenCV.js + ESP32</h1>
      {!cvReady && <p>Loading OpenCV.js...</p>}
      <video ref={videoRef} width={320} height={240} autoPlay playsInline style={{ display: 'block' }} />
      <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
      <div>
        <button disabled={processing || !cvReady} onClick={() => setAngles({ servo1: 100, servo2: 90, servo3: 120 })}>
          Simulate Move
        </button>
      </div>
      <div>
        <p>Detected Move: {move !== null ? move : 'None'}</p>
        <p>Angles: {angles ? JSON.stringify(angles) : 'None'}</p>
        <p>ESP32 Response: {esp32Response}</p>
      </div>
    </div>
  )
}

export default App
