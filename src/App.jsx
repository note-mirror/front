import {
  useState,
  useEffect
} from 'react'

import {
  Editor,
  EditorState,
  convertToRaw,
  convertFromRaw
} from 'draft-js'

import { io } from 'socket.io-client'
import styled from 'styled-components'

import QRCode from 'qrcode.react'
import QRReader from 'react-qr-reader'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
`

const StyledQRCode = styled(QRCode)`
  padding: 20px;
  width: 100px;
  height: 100px;
`

const QRCodeReader = ({ onScan }) => {
  // const [ open, setOpen ] = useState(false)

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  return (
    isMobile ?
      <QRReader
        delay={500}
        onScan={value => {
          if (value)
            onScan(value)
        }}
        style={{ height: '500px', width: '100%' }}
      /> : 'only available on mobile devices'
  )
}


function App() {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  const [target, setTarget] = useState('')
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())

  useEffect(() => {
    const socket = io('https://note-mirror.herokuapp.com/')

    setSocket(socket)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('update', ({ from, data }) => {
      setTarget(from)

      // Sets the editor state
      setEditorState(EditorState.createWithContent(convertFromRaw(data)))
    })
  }, [])

  const onEditorChange = (state) => {
    setEditorState(state)

    const data = convertToRaw(state.getCurrentContent())

    socket.emit('update', { target, data })
  }

  const handleQRCodeReaderOnScan = value => {
    setTarget(value)
  }

  return (
    <AppContainer>
      <div>
        <div> Socket QR Code: </div>
        <div>
          {connected && socket.id ? <StyledQRCode value={socket.id} size={200} /> : 'connect to generate the QR Code'}
        </div>
      </div>

      <div>
        Sending updates to: {target}
      </div>

      <div>
        {
          !target ?
            <QRCodeReader onScan={ handleQRCodeReaderOnScan } /> : ''

        }
      </div>

      {
        connected && target ? <Editor editorState={editorState} onChange={onEditorChange} /> : 'connect to send updates'
      }
    </AppContainer>
  )
}

export default App
