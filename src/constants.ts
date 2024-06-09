export const SCRAPE_DETAIL_SLEEEP = 2000
export const SCRAPE_URL_SLEEEP = 2000
export const SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST = 2 // small value cuz the toplist won't be updated that frequently, currently only has 83 pages
export const SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST = 100 // large because latest has like 19k+ pages

export const EVERY_6_HOURS = `0 */6 * * *`
export const EVERY_4_HOURS = `0 */4 * * *`
export const EVERY_5_SECONDS = `*/5 * * * * *`