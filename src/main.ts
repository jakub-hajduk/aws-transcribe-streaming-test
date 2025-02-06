import './style.css'
import { TranscribeClient } from './streaming-client'

// browsers: https://caniuse.com/?search=getusermedia
// https and localhost: https://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features/

const client = new TranscribeClient()

document.getElementById('start')!.addEventListener('click', () => {
  client.start()
})

document.getElementById('stop')!.addEventListener('click', () => {
  client.stop()
})

const textContainer = document.getElementById('transcribed-text')!

let currentLine= document.createElement('div')
textContainer.appendChild(currentLine)

client.handleResponse((text: string, newLine: boolean) => {
  currentLine.innerText = text

  if (newLine) {
    currentLine = document.createElement('div')
    textContainer.appendChild(currentLine)
  }
})


