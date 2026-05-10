const {PrismaClient} = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const {randomUUID} = require('crypto');

const p = new PrismaClient();
const UPLOAD_DIR = '/var/www/lux-back/public/uploads/products';

function downloadImage(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const ext = url.split('.').pop().split('?')[0].slice(0,4) || 'jpg';
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => resolve(`/uploads/products/${filename}`));
      file.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

async function main() {
  fs.mkdirSync(UPLOAD_DIR, {recursive: true});
  const products = await p.product.findMany({where:{images:{isEmpty:false}}});
  console.log(`Jami ${products.length} ta mahsulot`);
  
  for (const product of products) {
    const newImages = [];
    for (const img of product.images) {
      if (img.startsWith('http')) {
        console.log(`⬇️  ${product.id} yuklanmoqda...`);
        const local = await downloadImage(img);
        newImages.push(local || img);
        if (local) console.log(`✅ ${local}`);
        else console.log(`❌ Yuklanmadi, eski URL qoldi`);
      } else {
        newImages.push(img);
      }
    }
    await p.product.update({where:{id:product.id}, data:{images:newImages}});
  }
  console.log('🎉 Hammasi tayyor!');
}

main().finally(()=>p.$disconnect());
