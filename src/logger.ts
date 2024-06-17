import winston from 'winston'
import { ILogMessage } from './types/logger';
import { getSocket } from './socket/socket';


const httpTransportOptions = {
  host: 'localhost',
  port: 3000,
  path: '/log',
  ssl: false,
};

const customTransport = new winston.transports.Http({
  host: httpTransportOptions.host,
  port: httpTransportOptions.port,
  path: httpTransportOptions.path,
  ssl: httpTransportOptions.ssl,
  format: winston.format.json(),
  level: 'info',
  handleExceptions: true,
});

export const logger = winston.createLogger({
  transports: [customTransport],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

function handleNewLog(log: ILogMessage) {
  const { data, options, ...rest } = log
  const { shouldSendLogToCentralServer } = options || { shouldSendLogToCentralServer: true }
  const { level, timestamp, message } = rest;

  const finalPayload = {
    level,
    timestamp,
    message,
    data,
  }

  if (shouldSendLogToCentralServer) {
    const socket = getSocket()
    // console.log("Sending Log...", finalPayload, socket.id)
    socket.emit("LOG", finalPayload)
  }


}

logger.add(new winston.transports.Console({
  format: winston.format.simple()
}));

// Override the default log method
logger.on('data', handleNewLog);

