export type IWallhavenTag = {
	url:string;
	name:string;
}

export type IWallhavenColors = {
	color:string;
	url:string;
}

export type IWallhavenUploader = {
	name?:string;
	avatar?:string;
	url?:string;
}


export type IWallhavenMetaData = {
	category:string;
	purity:string;
	size: string;
	imageType:string;
	views:string;
}

export type IBulkInsertResponse = {
	imageExists: boolean;
}

export type IWallhavenImageDetails = {
	tags:IWallhavenTag[];	
	uploader:IWallhavenUploader;
	metadata:IWallhavenMetaData;
}


export type IWallhaven = {
	imageId: string;
	thumbSrc: string;
	src: string;
	url: string;
	resolution?: string;
	stars?: number;	
	colors?:IWallhavenColors;
	tags?:IWallhavenTag[];
	metadata?:IWallhavenMetaData;
	uploader?:IWallhavenUploader;
};


export interface IScrapeWallhaven {
  page?: number;
  totalPages?: number;
  pageType: 'latest' | 'toplist'; 
}


export interface IScrapedMetadata{
	currentPage:number;
	pageType:'latest' | 'toplist';
	source: "Wallhaven"
}