import * as cheerio from 'cheerio';
import { IBulkInsertResponse, IScrapeWallhaven, IScrapedMetadata, IWallhaven, IWallhavenColors, IWallhavenTag } from '../types/wallhaven';
import { getHTML } from './getHtml';
import { sleep } from '../utils';
import { WALLHAVEN_PREFIX, Wallhaven } from '../db/wallhaven';
import { SCRAPE_DETAIL_SLEEEP, SCRAPE_URL_SLEEEP } from '../constants';



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

	const wallpaperModel = new Wallhaven(WALLHAVEN_PREFIX);

	let currentPage = page;

	const previousScrapedDetails = await wallpaperModel.getScrapedDetails({ pageType })

	if (previousScrapedDetails) {
		currentPage = previousScrapedDetails?.currentPage ? Number(previousScrapedDetails.currentPage) + 1 : page
	}

	// return
	let nextScrapedPageMarker = currentPage
	let totalWallpapers = 0;
	let successfullScrapes = 0;
	let failedScrapes = 0;
	let allWallpapers: IWallhaven[] = []


	for (let i = currentPage; i <= currentPage + totalPages; i++) {
		try {
			console.log(`Querying https://wallhaven.cc/${pageType}?page=${i} | ${i}/${currentPage + totalPages}`)
			const html = await getHTML(`https://wallhaven.cc/${pageType}?page=${i}`);
			if (!html) {
				nextScrapedPageMarker += 1;
				failedScrapes += 1;
				await saveCurrentScrapedState({currentPage: nextScrapedPageMarker, pageType})
				continue
			}
			const wallpapers = parseWallhavenThumbnails(html) || [];
			const wallsWithDetails = await _handleScrapeWallpaperDetails(wallpapers)
			
			const savedResults = await saveWallhavenWallpapersToDB(wallsWithDetails)
			totalWallpapers += wallsWithDetails.length;
			successfullScrapes += 1
			allWallpapers = [...allWallpapers, ...wallsWithDetails]
			
			if (savedResults.imageExists) {
				console.info(`Wallpaper already exists. Skipping page ${i}. Sleeping for ${SCRAPE_URL_SLEEEP}ms`)
				nextScrapedPageMarker += 1;
				await saveCurrentScrapedState({currentPage: nextScrapedPageMarker, pageType})
				continue
			}

			console.log(`Finished scraping ${pageType} for page ${i}. Sleeping for ${SCRAPE_URL_SLEEEP}ms`)
			nextScrapedPageMarker += 1
			await saveCurrentScrapedState({currentPage: nextScrapedPageMarker, pageType})
			await sleep(SCRAPE_URL_SLEEEP)
		} catch (error) {
			nextScrapedPageMarker += 1
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