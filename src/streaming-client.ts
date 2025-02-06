import {
  StartStreamTranscriptionCommand,
  StartStreamTranscriptionCommandOutput,
  TranscribeStreamingClient
} from '@aws-sdk/client-transcribe-streaming'
import MicrophoneStream from 'microphone-stream'

export class TranscribeClient {
  client = new TranscribeStreamingClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.SECRET_ACCESS_KEY
    }
  })
  micStream?: MicrophoneStream

  command = new StartStreamTranscriptionCommand({
    LanguageCode: 'en-US',
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: 44100, // 8000, 44100 - the higher, the better quality, the better recognition.
    AudioStream: this.audioStream()
  })

  handleFn: (text: string, newLine: boolean) => void = () => {}

  async* audioStream() {
    if (!this.micStream) return

    const iterable = this.micStream as unknown as AsyncIterable<Buffer>

    for await (const chunk of iterable) {
      yield { AudioEvent: { AudioChunk: pcmEncodeChunk(chunk) } }
    }
  }


  async start() {
    this.micStream = new MicrophoneStream()
    try {
      this.micStream.setStream(
        await window.navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        }))

      const response = await this.client.send(this.command)
      await this.internalHandleResponse(response)
    } catch (e) {
      throw e
    }
  }

  async internalHandleResponse(response: StartStreamTranscriptionCommandOutput) {
    if (!response.TranscriptResultStream) return
    for await (const event of response.TranscriptResultStream) {

      const results = event.TranscriptEvent?.Transcript?.Results

      if (results) {
        results.map((result) => {
          (result.Alternatives || []).map((alternative) => {
            const transcript = alternative.Items?.map((item) => item.Content).join(' ') || ''
            this.handleFn(transcript, !result.IsPartial)
          })
        })
      }
    }
  }

  handleResponse(fn: (text: string, newLine: boolean) => void) {
    this.handleFn = fn
  }

  stop() {
    this.micStream?.stop()
  }
}
// Node and borwsers implementation of Buffers differ and 'microphone-stream' package uses Node.js Buffer.
// This is why we need "vite-plugin-node-polyfills" plugin for vite.
const pcmEncodeChunk = (chunk: Buffer) => {
  const input = MicrophoneStream.toRaw(chunk)
  var offset = 0
  var buffer = new ArrayBuffer(input.length * 2)
  var view = new DataView(buffer)
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return Buffer.from(buffer)
}
