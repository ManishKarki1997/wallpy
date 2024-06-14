import * as cheerio from 'cheerio';
import { IBulkInsertResponse, IScrapeWallhaven, IScrapedMetadata, IWallhaven, IWallhavenColors, IWallhavenTag } from '../types/wallhaven';
import { getHTML } from './getHtml';
import { sleep } from '../utils';
import { WALLHAVEN_PREFIX, Wallhaven } from '../db/wallhaven';
import { SCRAPE_DETAIL_SLEEEP, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST, SCRAPE_URL_SLEEEP, WALLHAVEN_LATEST_FETCH_TOTAL_PAGE_URL, WALLHAVEN_TOPLIST_FETCH_TOTAL_PAGE_URL } from '../constants';
import { getScrapedMetaData, saveWallpapers, setScrapedMetaData } from '../services/SUWallpaper.service';



export const parseWallhavenThumbnails = (html: string) => {
	const $ = cheerio.load(html);

	let images: IWallhaven[] = [];

	$('.thumb-listing-page ul li').each((index, element) => {
		const imgElement = $(element).find('figure img');

		const thumbSrc = $(element).find('figure img').attr('data-src') || '';
		const imageId = thumbSrc?.split('/').pop() || '';
		const thumbInfoWrapper = $(element).find('figure .thumb-info');
		const resolution = $(thumbInfoWrapper).find('span').text();
		const stars = $(thumbInfoWrapper).find('a').text() || undefined;

		images.push({
			imageId,
			thumbSrc,
			url: `https://wallhaven.cc/w/${imageId.split(".")[0]}`,
			src: `https://w.wallhaven.cc/full/${imageId.slice(0, 2)}/wallhaven-${imageId}`,
			resolution,
			stars: stars ? parseInt(stars) : undefined,
		});
	});
	return images;
};


export const parseImageDetails = async (url: string) => {
	const html = await getHTML(url);
	if (!html) return null

	const tags: IWallhavenTag[] = []
	const imageColors: IWallhavenColors[] = []

	const $ = cheerio.load(html);

	const tagLis = $('#tags li')
	$(tagLis).each((index, element) => {
		const tagName = $(element).find("a").text()
		const tagUrl = $(element).find('a').attr("href")

		tags.push({
			name: tagName,
			url: tagUrl!
		})
	})

	$(".color-palette	li").each((index, element) => {
		const url = $(element).find("a").attr("href") || ""
		const color = url?.split("=").pop() || ""

		if (url || color) {
			imageColors.push({
				url,
				color
			})
		}
	})

	const username = $('.username').text();
	const avatar = $(".avatar img").attr("src");
	const avatarUrl = $(".avatar").attr("href")
	let category = ""
	let purity = ""
	let size = ""
	let imageType = ""
	let views = ""

	$('[data-storage-id=showcase-info] dl dd').each((index, element) => {
		if (index === 1) {
			category = $(element).text()
		} else if (index === 2) {
			purity = $(element).find('span').text()
		} else if (index === 3) {
			size = $(element).text()
			if (size) {
				imageType = size.split(" - ").pop() || ""
				size = size.split(" - ").slice(0, 1).join(" ") || ""
			}
		} else if (index === 4) {
			views = $(element).text()
		}
	})


	return {
		tags,
		colors: imageColors,
		uploader: {
			name: username,
			avatar,
			url: avatarUrl,
		},
		metadata: {
			category,
			purity,
			size,
			imageType,
			views,
		}
	}

}

export const saveWallhavenWallpapersToDB = async (wallpapers: IWallhaven[]): Promise<IBulkInsertResponse> => {
	const wallpaperModel = new Wallhaven(WALLHAVEN_PREFIX);
	if (wallpapers.length) {
		const savedResults = await wallpaperModel.bulkInsert(wallpapers)
		return savedResults
	}

	return {
		imageExists: false
	}
}

const _handleScrapeWallpaperDetails = async (wallpapers: IWallhaven[]): Promise<IWallhaven[]> => {

	const wallsWithDetails = []
	let idx = 1

	for (const wallpaper of wallpapers) {
		try {
			const wallpaperDetails = await parseImageDetails(wallpaper.url)
			wallsWithDetails.push({
				...wallpaper,
				...wallpaperDetails
			})
			console.info(`Scraped details for wallpaper ${wallpaper.imageId}. ${idx}/${wallpapers.length} Completed. Sleeping for ${SCRAPE_DETAIL_SLEEEP}ms`)
			await sleep(SCRAPE_DETAIL_SLEEEP)
		} catch (error) {
			console.error(`Couldn't scrape details for wallpaper ${wallpaper.imageId}`, error?.message)
		} finally {
			idx += 1
		}
	}

	// @ts-ignore
	return wallsWithDetails
}

const saveCurrentScrapedState = async(params:IScrapedMetadata) => {
	console.log(`Setting scrape history `,params)
	const wallpaperModel = new Wallhaven(WALLHAVEN_PREFIX);
	await wallpaperModel.setScrapedDetails(params)
}


export const scrapeWallhaven = async ({
	page = 1, totalPages = 5, pageType = "latest"
}: IScrapeWallhaven): Promise<{
	totalWallpapers: number;
	successfullScrapes: number;
	failedScrapes: number;
	allWallpapers: IWallhaven[]
} | null> => {
	if (pageType !== 'latest' && pageType !== 'toplist') return null

	const totalPageFetchURL = pageType=== 'latest' ? WALLHAVEN_LATEST_FETCH_TOTAL_PAGE_URL : WALLHAVEN_TOPLIST_FETCH_TOTAL_PAGE_URL

	const totalAvailablePage =	await getWallhavenPageTotalCount(totalPageFetchURL)

	if(!totalAvailablePage){
		return null
	}

	let currentPage = totalAvailablePage;

	// TODO for the scraped metadata, i might need to update the logic
	// first of all, before even running any scraping logic, i need to visit the .https://wallhaven.cc/latest?page=1 page and see what the total pages is
	// i'm assuming the new wallpapers are rendered on page 1. 
	// now, i need to reverse this previousScrapedDetails logic, instead of increasing from 1 to whatever currentPage is saved in the database
	// i need to get the currentPage from DB and run scraping logic from currentPage to currentPage - SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST until it reaches 1

	// const previousScrapedDetails = await wallpaperModel.getScrapedDetails({ pageType })
	// if(pageType !== 'toplist'){
// for toplist wallpapers, we need the freshest wallpapers 
		const previousScrapedDetails = await getScrapedMetaData({ pageType, source:"Wallhaven" })	
		if (previousScrapedDetails) {
			currentPage = previousScrapedDetails?.page ? Number(previousScrapedDetails.page) + 1 : totalAvailablePage
		}
	// }
	
	
	let howManyToScrapePerSession =pageType=== 'latest'? SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST :SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST
	const uptoPage = Math.max(currentPage - howManyToScrapePerSession,1)
	console.log("totalAvailablePage",totalAvailablePage, previousScrapedDetails)
	console.log("scraping from", currentPage, "to", currentPage - howManyToScrapePerSession)
		
	// return null

	let nextScrapedPageMarker = currentPage
	let totalWallpapers = 0;
	let successfullScrapes = 0;
	let failedScrapes = 0;
	let allWallpapers: IWallhaven[] = []	
	let currentPageBeingScraped = 1;

	// for (let i = currentPage; i <= currentPage + totalPages; i++) {
		for (let i = currentPage; i >= uptoPage && i >= 1; i--) {
			currentPageBeingScraped+=1
		try {
			console.log(`Querying https://wallhaven.cc/${pageType}?page=${i} | ${currentPageBeingScraped}/${howManyToScrapePerSession}`)
			const html = await getHTML(`https://wallhaven.cc/${pageType}?page=${i}`);
			if (!html) {
				nextScrapedPageMarker = i;
				failedScrapes += 1;
				await setScrapedMetaData({currentPage: nextScrapedPageMarker, pageType,source:"Wallhaven"})
				continue
			}
			const wallpapers = parseWallhavenThumbnails(html) || [];


			const wallsWithDetails = await _handleScrapeWallpaperDetails(wallpapers)

			// for testing purposes, only scrape details of 2 wallpapers per page
			// const wallsWithDetails = await _handleScrapeWallpaperDetails(wallpapers.slice(0,2))
			
			// await saveWallpapers(wallsWithDetails.slice(0,2))
			await saveWallpapers(wallsWithDetails)
			totalWallpapers += wallsWithDetails.length;
			successfullScrapes += 1
			allWallpapers = [...allWallpapers, ...wallsWithDetails]
			
			// if (savedResults.imageExists) {
			// 	console.info(`Wallpaper already exists. Skipping page ${i}. Sleeping for ${SCRAPE_URL_SLEEEP}ms`)
			// 	nextScrapedPageMarker += 1;
			// 	await saveCurrentScrapedState({currentPage: nextScrapedPageMarker, pageType})
			// 	continue
			// }

			console.log(`Finished scraping ${pageType} for page ${i}. Sleeping for ${SCRAPE_URL_SLEEEP}ms`)
			nextScrapedPageMarker = i
			await setScrapedMetaData({currentPage: nextScrapedPageMarker, pageType, source:"Wallhaven"})
			// await saveCurrentScrapedState({currentPage: nextScrapedPageMarker, pageType})
			await sleep(SCRAPE_URL_SLEEEP)
		} catch (error) {
			nextScrapedPageMarker = i
			failedScrapes += 1
		}
	}

console.log(`Finished scraping ${pageType} wallpapers`)

	return {
		totalWallpapers,
		failedScrapes,
		successfullScrapes,
		allWallpapers
	}

}


export const getWallhavenPageTotalCount = async(url: string) => {
	const html = await getHTML(url);

	if(!html) return null

	const $ = cheerio.load(html);

	const headerElement= $(".thumb-listing-page-header")

	// const currentPage = headerElement.find(".thumb-listing-page-num").text();
	const allPageText = headerElement.text();
	const totalPage = +allPageText.split(" / ")[1].trim() || null;

	return totalPage 

}