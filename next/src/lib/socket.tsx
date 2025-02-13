'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { io } from 'socket.io-client'
import { Message } from './types'

const socket = io(process.env.NEXT_PUBLIC_API_ORIGIN, {
  path: process.env.NEXT_PUBLIC_API_PATH + '/socket.io',
  autoConnect: false,
})

export type SocketState = {
  connected: boolean
  partyId?: string
  users: string[]
  messages: Message[]
  connect: (token: string) => void
  disconnect: () => void
  joinParty: (id: string) => void
  joinTopic: (id: string) => void
  sendMessage: (body: string) => void
}

const SocketContext = createContext<SocketState>({
  connected: false,
  users: [],
  messages: [],
  connect: () => {},
  disconnect: () => {},
  joinParty: () => {},
  joinTopic: () => {},
  sendMessage: () => {},
})

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [partyId, setPartyId] = useState<string | undefined>()
  const [users, setUsers] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('user:online', (online: string[]) => {
      setUsers(online)
    })

    socket.on('message:created', (message: Message) => {
      setMessages((messages) => [message, ...messages])
    })
  }, [])

  const connect = useCallback((token: string) => {
    socket.io.opts.extraHeaders = {
      authorization: `Bearer ${token}`,
    }

    socket.connect()
  }, [])

  const disconnect = useCallback(() => {
    socket.disconnect()

    delete socket.io.opts.extraHeaders?.authorization
  }, [])

  const joinParty = useCallback((id: string) => {
    setPartyId(undefined)

    socket.emit('party:join', id, (id: string) => {
      setPartyId(id)
    })
  }, [])

  const joinTopic = useCallback((id: string) => {
    setMessages([])

    socket.emit('topic:join', id)
  }, [])

  const sendMessage = useCallback((body: string) => {
    socket.emit('message:create', body)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        connected,
        partyId,
        users,
        messages,
        connect,
        disconnect,
        joinParty,
        joinTopic,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
