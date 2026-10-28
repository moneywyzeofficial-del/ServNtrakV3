const https = require('https');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.STITCH_API_KEY || process.env.GOOGLE_API_KEY || '';
const projectId = '4150947803542053750';
const outputDir = path.resolve('stitch-imports');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function callMcp(method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: method, arguments: params }
    });

    const req = https.request({
      hostname: 'stitch.googleapis.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Invalid JSON: ' + body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('A consultar ecrãs do Google Stitch...');
  const res = await callMcp('list_screens', { projectId });
  const content = JSON.parse(res.result.content[0].text);
  const screens = content.screens || [];
  console.log(`Encontrados ${screens.length} ecrãs no projeto.`);

  const manifest = [];

  for (const s of screens) {
    if (!s.htmlCode) continue;
    const sanitizedTitle = s.title.replace(/[\\/:*?"<>|]/g, '-').trim();
    console.log(`A descarregar: ${s.title}...`);
    try {
      const fileRes = await callMcp('download_file', { name: s.htmlCode.name });
      const fileData = JSON.parse(fileRes.result.content[0].text);
      const html = fileData.html || fileData;
      const filename = `${sanitizedTitle}.html`;
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, typeof html === 'string' ? html : JSON.stringify(html, null, 2), 'utf8');

      manifest.push({
        title: s.title,
        screenName: s.name,
        deviceType: s.deviceType,
        localFile: filename,
        downloadUrl: s.htmlCode.downloadUrl
      });
    } catch (err) {
      console.error(`Erro ao descarregar ${s.title}:`, err.message);
    }
  }

  fs.writeFileSync(path.join(outputDir, 'stitch-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Concluído! ${manifest.length} ecrãs descarregados para: ${outputDir}`);
}

run().catch(err => console.error(err));
