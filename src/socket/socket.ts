import io, { Socket } from 'socket.io-client'
import { APP_NAME } from '../constants'
import dotenv from 'dotenv';
import { logger } from '../logger';

dotenv.config()

let socket: Socket | null = null;

export const setupSocketLogger = () => {
  socket = io(process.env.LOGGER_SERVER_URL || "http://192.168.1.162:7000", {
    rejectUnauthorized: false,
    secure: false,
    transports: ['websocket'],
  })

  socket.on("connect", () => {
    console.log(`Connected to logger server`)
    logger.info(`Connected to logger server`)

    setInterval(() => {
      logger.info("Hello from logger server")
    }, 7000)
  })

  socket.on("connect_error", (err) => {
    logger.error("Couldn't connect to the logging server. connect_error ", err)
  })

  socket.emit("JOIN", {
    name: APP_NAME,
  })
}

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket is not initialized');
  }
  return socket;
};