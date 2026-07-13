const fs = require('fs');

const html = fs.readFileSync('kommo_screenshots/chats_page.html', 'utf8');

// Regex for extracting class names of major div structures
const matches = html.match(/class="([^"]+)"/g);
const uniqueClasses = [...new Set(matches)].slice(0, 50);

console.log("Top 50 Classes:");
console.log(uniqueClasses.join('\n'));

// Extract some text to see what is on the screen
const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
console.log("\nFirst 2000 chars of text content:");
console.log(textContent);
