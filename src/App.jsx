import {
  useState,
  useEffect
} from 'react'

import { io } from 'socket.io-client'
import styled from 'styled-components'

import QRCode from 'qrcode.react'
import QRCodeReader from 'react-qr-reader'

import QRCodeIcon from './components/QRCodeIcon'
import ArrowLeftIcon from './components/ArrowLeftIcon'

const AppContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: ${ ({ height }) => height }px;
  width: 100vw;
`

const StyledTextArea = styled.textarea`
  padding: 72px 12px 12px 12px;
  font-size: 14px;

  width: 100%;
  height: 100%;

  border: none;
  resize: none;

  &:focus {
    outline: none;
  }
`
const QRCodeContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;

  align-items: center;
  justify-content: center;
`

const Button = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 12px;

  background: #FFFFFF;
  border: 1px solid #e0e0e0;
  border-radius: 8px;

  user-select: none;

  &:active {
    background-color: black;
    border-color: black;

    color: white;

    > svg
    > path {
      fill: white;
    }
  }
`

const Header = styled.div`
  position: fixed;
  display: flex;
  padding: 12px 12px 0 12px;
  top: 0;
  left: 0;
  width: 100%;

  z-index: 999;

  ${({ direction }) => direction === 'reverse' ? 'flex-direction: row-reverse;' : ''}
`

const QRCodeScannerContainer = styled.div`
  position: fixed;

  display: flex;
  align-items: center;
  justify-content: center;

  top: 0px;
  left: 0px;

  height: 100%;
  width: 100%;

  background-color: white;
`

const QRCodeScannerWrapper = styled.div`
  width: 80vw;
  height: 80vw;
  overflow: hidden;
  border-radius: 8px;
`

const NOTE_LOCAL_STORAGE_KEY = 'note'

const checkIsMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const setLocalStorageState = (key, value) => localStorage.setItem(key, value)
const getLocalStorageState = (key, value) => localStorage.getItem(key)

const useWindowInnerHeightObserver = () => {
  const [ innerHeight, setInnerHeight ] = useState(window.innerHeight)

  useEffect(() => {
    const handler = () => {
      setInnerHeight(window.innerHeight)
    }

    window.addEventListener('resize', handler)

    return () => window.removeEventListener('resize', handler)
  }, [])

  return innerHeight
}

function App() {
  const [mobile] = useState(checkIsMobile())
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  const [state, setState] = useState(getLocalStorageState(NOTE_LOCAL_STORAGE_KEY) || '')
  const [target, setTarget] = useState('')
  const [scannerOpenned, setScannerOpenned] = useState(false)

  const innerHeight = useWindowInnerHeightObserver()

  const updateState = value => {
    setState(value)
    setLocalStorageState(NOTE_LOCAL_STORAGE_KEY, value || '')
  }

  useEffect(() => {
    // socket.io Connection
    const socket = io('https://note-mirror.herokuapp.com/')

    setSocket(socket)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('update', ({ from, data }) => {
      setTarget(from)
      updateState(data)
    })

    // persistence check
    if (navigator.storage && navigator.storage.persist)
      navigator.storage.persist().then(isPersisted => console.log(`Persisted storage granted: ${isPersisted}`))

  }, [])

  const handleTextAreaOnChange = (e) => {
    const data = e.target.value

    updateState(data)

    if (connected && target)
      socket.emit('update', { target, data })
  }

  const handleQRCodeReaderOnScan = value => {
    if (!value)
      return

    setTarget(value)
    setScannerOpenned(false)

    socket.emit('update', {
      target: value,
      data: state
    })
  }

  return (
    <AppContainer height={ innerHeight }>
      {
        !mobile &&
        !target &&
        <QRCodeContainer>
          {
            connected &&
            socket.id &&
            <div>
              <QRCode value={socket.id} size={200} />
            </div>
          }
        </QRCodeContainer>
      }

      {
        !mobile &&
        target &&
        <StyledTextArea
          value={state}
          onChange={handleTextAreaOnChange}
          placeholder="Start typing something..." />
      }

      {
        mobile &&
        !scannerOpenned &&
        <>
          <Header direction="reverse">
            {
              connected &&
              <Button onClick={ () => setScannerOpenned(true) }>
                <QRCodeIcon />
              </Button>
            }
          </Header>
          <StyledTextArea
            value={state}
            onChange={handleTextAreaOnChange}
            placeholder="Start typing something..." />
        </>
      }

      {
        scannerOpenned &&
        <QRCodeScannerContainer>
          <Header>
            <Button onClick={ () => setScannerOpenned(false) }>
              <ArrowLeftIcon />
            </Button>
          </Header>

          <QRCodeScannerWrapper>
            <QRCodeReader
              delay={500}
              showViewFinder={false}
              onScan={ handleQRCodeReaderOnScan }
              style={{ height: "100%", width: "100%" }}
            />
          </QRCodeScannerWrapper>
        </QRCodeScannerContainer>
      }

    </AppContainer>
  )
}

export default App
