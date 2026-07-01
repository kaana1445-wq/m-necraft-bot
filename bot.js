const mineflayer = require('mineflayer');
const readline = require('readline');

// ================= AYARLAR =================
const sunucuAyarlari = {
  host: 'mc.atlasoyuncu.com',
  port: 25565,
  username: 'myname9940',
  version: '1.20.1',
  viewDistance: 'tiny'
};

const BOT_PASSWORD = 'sifre'; // <-- Şifren burada kral!

const reklamMesaji = ''; 
// ===========================================

let bot;
let asama = 0;
let rlInterface = null;

let reklamSayaci = null;
let ziplamaSayaci = null;
let homeSayaci = null;

let autoDigEnabled = false;

function sayaclariTemizle() {
  if (reklamSayaci) { clearInterval(reklamSayaci); reklamSayaci = null; }
  if (ziplamaSayaci) { clearInterval(ziplamaSayaci); ziplamaSayaci = null; }
  if (homeSayaci) { clearInterval(homeSayaci); homeSayaci = null; }
}

function rastgeleSure(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function yumusakBak(hedefYaw, placeholder, sure = 600) {
  if (!bot || !bot.entity) return;
  const adimSayisi = 10;
  const adimSuresi = sure / adimSayisi;
  let mevcutAdim = 0;

  const baslangicYaw = bot.entity.yaw;
  const baslangicPitch = bot.entity.pitch;

  const diffYaw = hedefYaw - baslangicYaw;
  const diffPitch = placeholder - baslangicPitch;

  const bakisDongusu = setInterval(() => {
    mevcutAdim++;
    const oran = mevcutAdim / adimSayisi;
    
    const anlikYaw = baslangicYaw + (diffYaw * oran);
    const anlikPitch = baslangicPitch + (diffPitch * oran);

    bot.look(anlikYaw, anlikPitch, true);

    if (mevcutAdim >= adimSayisi) {
      clearInterval(bakisDongusu);
    }
  }, adimSuresi);
}

function enYakinAnaYonuBul(mevcutYaw) {
  let pi2 = Math.PI * 2;
  let normalizeYaw = ((mevcutYaw % pi2) + pi2) % pi2;
  const yonler = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI * 2];
  
  let enYakin = yonler[0];
  let enKucukFark = Math.abs(normalizeYaw - yonler[0]);
  
  for (let i = 1; i < yonler.length; i++) {
    let fark = Math.abs(normalizeYaw - yonler[i]);
    if (fark < enKucukFark) {
      enKucukFark = fark;
      enYakin = yonler[i];
    }
  }
  return enYakin === Math.PI * 2 ? 0 : enYakin;
}

function blokYuru(yon, blokSayisi) {
  if (!bot || !bot.entity) return;
  
  const yaw = bot.entity.yaw;
  let dx = 0;
  let dz = 0;
  const yuruSuresi = blokSayisi * rastgeleSure(240, 270); 

  if (yon === 'forward') { dx = -Math.sin(yaw) * blokSayisi; dz = -Math.cos(yaw) * blokSayisi; }
  else if (yon === 'back') { dx = Math.sin(yaw) * blokSayisi; dz = Math.cos(yaw) * blokSayisi; }
  else if (yon === 'left') { dx = Math.cos(yaw) * blokSayisi; dz = -Math.sin(yaw) * blokSayisi; }
  else if (yon === 'right') { dx = -Math.sin(yaw) * blokSayisi; dz = Math.sin(yaw) * blokSayisi; }

  const hedefKonum = bot.entity.position.offset(dx, 0, dz);
  bot.lookAt(hedefKonum.offset(0, 1.62, 0), true);
  
  setTimeout(() => {
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('forward', false);
      console.log(`[HAREKET] Başarıyla ${yon} yönüne doğru ${blokSayisi} blok yüründü.`);
    }, yuruSuresi);
  }, rastgeleSure(150, 250));
}

function hizalaVeKazmayaBasla() {
  if (!bot || !bot.entity) return;
  
  autoDigEnabled = false; 
  console.log('[HİZALAMA] Güvenli yön koruması devrede. Önce 1 adım öne yürünüyor...');
  
  bot.setControlState('forward', true);
  
  setTimeout(() => {
    bot.setControlState('forward', false);
    console.log('[HİZALAMA] Adım atıldı. Gövde ve kafa jeneratöre pürüzsüzce kilitleniyor...');
    
    setTimeout(() => {
      const anaYonAçisi = enYakinAnaYonuBul(bot.entity.yaw);
      yumusakBak(anaYonAçisi, 0, 700);
      console.log('[HİZALAMA] Kilitlenme başarılı! Miner sadece tam karşı hizada 350ms tempo ile başlıyor...');
      
      setTimeout(() => {
        autoDigEnabled = true;
        console.log('[SİSTEM] Miner aktif duruma getirildi.');
      }, 800);

    }, 300);

  }, 260);
}

function botuBaslat() {
  sayaclariTemizle();
  autoDigEnabled = false;

  console.log('Bot seri kazma ve reklam ayarlarıyla sunucuya bağlanıyor...');
  bot = mineflayer.createBot(sunucuAyarlari);
  asama = 0;

  bot.on('message', (message) => {
    const text = message.toString();
    const kucukText = text.toLowerCase();
    console.log(`[SUNUCU]: ${text}`);

    if ((kucukText.includes('/gir') || kucukText.includes('/login') || kucukText.includes('giriş yapmak için')) && asama !== 1) {
      console.log('--> GİRİŞ EKRANINA ATILMA ALGILANDI! Sayaçlar durduruluyor...');
      sayaclariTemizle();
      autoDigEnabled = false;

      asama = 1;
      const gecikme = rastgeleSure(2200, 3500);
      setTimeout(() => {
        bot.chat(`/l ${BOT_PASSWORD}`); 
        console.log(`--> Şifre başarıyla gönderildi.`);
      }, gecikme);
    }
  });

  bot.on('spawn', () => {
    if (asama === 1) {
      asama = 2;
      const lobiGecikme = rastgeleSure(4500, 6000);
      console.log(`--> Ana lobi yüklendi. ${lobiGecikme}ms bekleniyor...`);
      setTimeout(() => {
        bot.chat('/skyblock');
        console.log('--> Skyblock dünyasına geçiş komutu verildi.');
      }, lobiGecikme);
    }
    
    else if (asama === 2) {
      asama = 3;
      console.log('--> Skyblock algılandı. Sunucu engeline takılmamak için önce hareket ediliyor...');
      
      setTimeout(() => {
        bot.setControlState('forward', true);
        
        setTimeout(() => {
          bot.setControlState('forward', false);
          
          const homeGecikme = rastgeleSure(1800, 2500);
          setTimeout(() => {
            bot.chat('/home'); 
            console.log('--> Adaya gitme komutu gönderildi!');

            setTimeout(() => {
              if (bot && bot.entity) { bot.chat(reklamMesaji); console.log(`[BOT REKLAM]: İlk reklam başarıyla gönderildi.`); }
            }, 2000);

            reklamSayaci = setInterval(() => {
              if (bot && bot.entity) { bot.chat(reklamMesaji); console.log(`[BOT REKLAM]: Periyodik reklam gönderildi.`); }
            }, 5 * 60 * 1000);

            ziplamaSayaci = setInterval(() => {
              if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => { bot.setControlState('jump', false); }, 150);
                console.log(`[BOT EYLEM]: Otomatik afk koruması için zıplandı.`);
              }
            }, 1 * 60 * 1000);

            homeSayaci = setInterval(() => {
              if (bot && bot.entity) {
                bot.chat('/home');
                console.log(`[BOT EYLEM]: Otomatik /home çekildi. Güvenli yön senkronizasyonu başlatılıyor...`);
                
                setTimeout(() => {
                  hizalaVeKazmayaBasla();
                }, 2500);
              }
            }, 3 * 60 * 1000);

            setTimeout(() => {
                hizalaVeKazmayaBasla();
            }, 2500);

          }, homeGecikme);

        }, rastgeleSure(320, 380)); 
      }, 3000);
    }
  });

  bot.on('windowOpen', (window) => {
    console.log(`[BUG KORUMASI] Ekran açıldı (ID: ${window.id}), kazma devam ediyor.`);
  });

  if (rlInterface) rlInterface.close();

  rlInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rlInterface.on('line', async (input) => {
    const temizInput = input.trim();
    const komut = temizInput.toLowerCase();

    if (!bot || !bot.entity) return;

    if (komut === '/m') {
      autoDigEnabled = !autoDigEnabled;
      console.log(`\n[SİSTEM] Miner Durumu: ${autoDigEnabled ? '▲ AÇILDI' : '▼ KAPATILDI'}\n`);
      return;
    }

    if (/^\/[1-9]$/.test(komut)) {
      const slotNumarasi = parseInt(komut.replace('/', '')) - 1;
      setTimeout(() => {
        bot.setQuickBarSlot(slotNumarasi);
        console.log(`[ENVANTER] Elindeki aktif slot ${slotNumarasi + 1} olarak değiştirildi.`);
      }, rastgeleSure(100, 250));
      return;
    }

    if (komut === 'e') {
      const items = bot.inventory.items();
      if (items.length === 0) { console.log('[ENVANTER] Boş.'); } 
      else {
        console.log('\n--- ENVANTER ---');
        items.forEach(item => console.log(`- Slot ${item.slot}: ${item.name} x${item.count}`));
        console.log('----------------\n');
      }
    }
    
    else if (komut === 'q') {
      const items = bot.inventory.items();
      if (items.length > 0) {
        for (const item of items) {
          try {
            await bot.tossStack(item);
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (hata) {}
        }
        console.log('-> Envanter yere fırlatıldı.');
      }
    }

    else if (komut === 'space') {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }

    else if (komut === 'f' || komut === 'düz') {
      const anaYonAçisi = enYakinAnaYonuBul(bot.entity.yaw);
      yumusakBak(anaYonAçisi, 0, 600);
      console.log('[HAREKET] Gövde ve kafa en yakın ana yöne hizalandı.');
    }

    else if (/^\d*[wads]$/.test(komut)) {
      const eslesme = komut.match(/^(\d*)([wads])$/);
      const blokSayisi = eslesme[1] ? parseInt(eslesme[1]) : 1;
      const harf = eslesme[2];

      let yon = 'forward';
      if (harf === 's') yon = 'back';
      if (harf === 'a') yon = 'left';
      if (harf === 'd') yon = 'right';

      blokYuru(yon, blokSayisi);
    }
    
    else if (temizInput.length > 0) {
      bot.chat(temizInput);
    }
  });

  bot.on('kick', (reason) => {
    console.log(`ATILMA SEBEBİ: ${reason}`);
    sayaclariTemizle();
  });
  
  bot.on('end', () => {
    console.log('Bağlantı koptu. 15 saniye sonra yeniden bağlanılacak...');
    sayaclariTemizle();
    autoDigEnabled = false;
    setTimeout(botuBaslat, 15000);
  });
  
  bot.on('error', (err) => console.log(`Hata: ${err}`));
}

// Tam Karşı Hattı 4 Blok Kazma Sistemi (350ms)
setInterval(() => {
    if (!autoDigEnabled || !bot || !bot.entity) return; 

    const yaw = bot.entity.yaw;
    const dx = -Math.sin(yaw);
    const dz = -Math.cos(yaw);

    let blockTarget = null;

    for (let i = 1; i <= 4; i++) {
        const checkBlock = bot.blockAt(bot.entity.position.offset(dx * i, 1.62, dz * i));
        if (checkBlock && checkBlock.type !== 0) {
            blockTarget = checkBlock;
            break; 
        }
    }

    if (blockTarget) {
        if (!bot.targetDigBlock) {
            bot.dig(blockTarget, 'ignore', err => {});
        }
    }
}, 350);

botuBaslat();
