export type IQueueJob = {
  name:string;
  data?:any;
}

export type IJobHandler = (data?:any) => Promise<any>