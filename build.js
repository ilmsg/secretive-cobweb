const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const markdownToHtml = require('zenn-markdown-html').default;

const DIST_DIR = 'dist';

const createPage = (title, contentHtml, backLink = '') => `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://unpkg.com">
  <script src="https://zenn.studio"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; line-height: 1.7; background: #f9fafb; margin: 0; }
    .container { max-width: 820px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .nav { margin-bottom: 24px; font-size: 14px; }
    .nav a { color: #3ea8ff; text-decoration: none; }
    .card-list { list-style: none; padding: 0; }
    .card-list li { border-bottom: 1px solid #eee; padding: 12px 0; }
    .card-list a { text-decoration: none; color: #111; font-weight: bold; font-size: 18px; }
    .card-list a:hover { color: #3ea8ff; }
  </style>
</head>
<body>
  <div class="container">
    ${backLink ? `<div class="nav"><a href="${backLink}">← กลับหน้าหลัก</a></div>` : ''}
    ${contentHtml}
  </div>
</body>
</html>`;

async function build() {
  // 1. เตรียมโฟลเดอร์ dist และคัดลอกโฟลเดอร์ images (ถ้ามี)
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST_DIR, 'articles'), { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, 'books'), { recursive: true });

  if (fs.existsSync('images')) {
    fs.cpSync('images', path.join(DIST_DIR, 'images'), { recursive: true });
  }

  const articleLinks = [];
  const bookLinks = [];

  // 2. แปลงโฟลเดอร์ articles/
  if (fs.existsSync('articles')) {
    const files = fs.readdirSync('articles').filter(f => f.endsWith('.md'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join('articles', file), 'utf8');
      const { data, content } = matter(raw);
      const slug = file.replace(/\.md$/, '');
      
      // ใส่ await ตรงนี้
      const htmlBody = await markdownToHtml(content);
      
      const pageHtml = createPage(
        data.title || slug,
        `<h1>${data.emoji || '📝'} ${data.title || slug}</h1><div class="znc">${htmlBody}</div>`,
        '../index.html'
      );
      
      fs.writeFileSync(path.join(DIST_DIR, 'articles', `${slug}.html`), pageHtml);
      articleLinks.push(`<li><a href="articles/${slug}.html">${data.emoji || '📝'} ${data.title || slug}</a></li>`);
    }
  }

  // 3. แปลงโฟลเดอร์ books/
  if (fs.existsSync('books')) {
    const bookFolders = fs.readdirSync('books').filter(f => fs.statSync(path.join('books', f)).isDirectory());
    for (const bookSlug of bookFolders) {
      const bookPath = path.join('books', bookSlug);
      const outBookPath = path.join(DIST_DIR, 'books', bookSlug);
      fs.mkdirSync(outBookPath, { recursive: true });

      let bookTitle = bookSlug;
      let chapters = [];

      const configPath = path.join(bookPath, 'config.yaml');
      if (fs.existsSync(configPath)) {
        const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
        bookTitle = config.title || bookSlug;
        chapters = config.chapters || [];
      } else {
        chapters = fs.readdirSync(bookPath).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
      }

      const chapterLinks = [];
      for (const chapSlug of chapters) {
        const chapFile = path.join(bookPath, `${chapSlug}.md`);
        if (!fs.existsSync(chapFile)) continue;

        const raw = fs.readFileSync(chapFile, 'utf8');
        const { data, content } = matter(raw);
        
        // ใส่ await ตรงนี้ด้วย
        const htmlBody = await markdownToHtml(content);

        const chapHtml = createPage(
          `${data.title || chapSlug} - ${bookTitle}`,
          `<h1>${data.title || chapSlug}</h1><div class="znc">${htmlBody}</div>`,
          'index.html'
        );

        fs.writeFileSync(path.join(outBookPath, `${chapSlug}.html`), chapHtml);
        chapterLinks.push(`<li><a href="${chapSlug}.html">${data.title || chapSlug}</a></li>`);
      }

      const bookIndexHtml = createPage(
        bookTitle,
        `<h1>📚 ${bookTitle}</h1><ul class="card-list">${chapterLinks.join('')}</ul>`,
        '../../index.html'
      );
      fs.writeFileSync(path.join(outBookPath, 'index.html'), bookIndexHtml);
      bookLinks.push(`<li><a href="books/${bookSlug}/index.html">📚 ${bookTitle}</a></li>`);
    }
  }

  // 4. สร้างหน้าแรก (index.html)
  const mainIndexHtml = createPage(
    'My Zenn Notes',
    `<h1>บทความ (Articles)</h1><ul class="card-list">${articleLinks.join('') || '<li>ไม่มีบทความ</li>'}</ul>
     <h1 style="margin-top: 40px;">หนังสือ (Books)</h1><ul class="card-list">${bookLinks.join('') || '<li>ไม่มีหนังสือ</li>'}</ul>`
  );
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), mainIndexHtml);

  console.log('✅ แปลงทั้งโปรเจกต์เสร็จสมบูรณ์! เนื้อหาพร้อมใช้งานในโฟลเดอร์ dist/');
}

build().catch(console.error);
