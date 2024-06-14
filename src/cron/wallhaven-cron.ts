import cron from 'node-cron'
import { EVERY_2_MINUTES, EVERY_4_HOURS, EVERY_5_SECONDS, EVERY_6_HOURS, EVERY_HOUR, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST, SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST } from '../constants'
import { scrapeWallhaven } from '../helpers/parseWallhaven'

export const runWallhavenCRON = () => {
  cron.schedule(EVERY_6_HOURS,async() => {
    console.log(`Scraping toplist wallpapers every 6 hour`)
    await scrapeWallhaven({ page:1, totalPages: SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST,pageType: "toplist"  })    
  })

  // cron.schedule(EVERY_2_MINUTES,async() => {
  //   console.log(`Scraping toplist wallpapers every 2 mins`)
  //   await scrapeWallhaven({ page:1, totalPages: SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_TOPLIST,pageType: "toplist"  })    
  // })
  
  cron.schedule(EVERY_HOUR,async() => {
    console.log(`Scraping latest wallpapers every hour`)
    await scrapeWallhaven({ page:1, totalPages: SCRAPE_TOTAL_PAGES_EACH_TIME_WALLHAVEN_LATEST,pageType: "latest"  })
  })
}