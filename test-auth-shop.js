import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Go to login page
    await page.goto('http://localhost:3001/login');
    
    // Fill credentials (assuming simple standard seeded admin/user or we'll type a valid one)
    await page.type('input[name="email"]', 's@s.com');
    await page.type('input[name="password"]', '123123');
    
    // Submit
    await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]')
    ]);
    
    // Navigate to shop logic
    await Promise.all([
        page.waitForNavigation(),
        page.goto('http://localhost:3001/shop')
    ]);
    
    console.log("Loaded shop page as authenticated user.");
    await browser.close();
})();
