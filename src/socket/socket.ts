import io, { Socket } from 'socket.io-client'
import { APP_NAME } from '../constants'
import dotenv from 'dotenv';
import { logger } from '../logger';

dotenv.config()

let socket: Socket | null = null;

export const setupSocketLogger = () => {
  socket = io(process.env.LOGGER_SERVER_URL || "http://192.168.1.162:7000")

  socket.on("connect", () => {
    console.log(`Connected to logger server`)

    // setInterval(() => {
    //   logger.error("Hello from logger server", {
    //     data: {

    //     },
    //     options: {
    //       shouldSendLogToCentralServer: true
    //     }
    //   })
    // }, 7000)
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