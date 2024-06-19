import io, { Socket } from 'socket.io-client'
import dotenv from 'dotenv';

dotenv.config()

let socket: Socket | null = null;

export const setupSocketLogger = () => {
  socket = io(process.env.LOGGER_SERVER_URL || "http://192.168.1.162:7000", {
    rejectUnauthorized: false,
    secure: false,
    transports: ['websocket'],
  })

  return socket
}

export const getSocket = () => {
  if (!socket) {
    console.error(`Socket not connected`)
    return
  }

  return socket
}
