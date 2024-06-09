import cron from 'node-cron'
import { EVERY_4_HOURS, EVERY_5_SECONDS, EVERY_6_HOURS, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST } from '../constants'
import { scrapeWallhaven } from '../helpers/parseWallhaven'

export const runWallhavenCRON = () => {
  cron.schedule(EVERY_6_HOURS,async() => {
    console.log(`Scraping toplist wallpapers every 6 hours`)
    await scrapeWallhaven({ page:1, totalPages: SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST,pageType: "toplist"  })    
  })
  cron.schedule(EVERY_4_HOURS,async() => {
    console.log(`Scraping latest wallpapers every 4 hours`)
    await scrapeWallhaven({ page:1, totalPages: SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST,pageType: "latest"  })
  })
}