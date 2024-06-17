export interface ILogOption {
  shouldSendLogToCentralServer: boolean;
}

export interface ILogMessage {
  message: string;
  level: string;
  timestamp: string;
  data?: any;
  options?: ILogOption;
}
