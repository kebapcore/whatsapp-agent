# 🔥 WhatsApp AI Agent - Termux Edition (7/24 Operation)

Termux'ta optimize edilmiş, tek dosyalı WhatsApp AI Agent. Bunların hepsini içerir:
- **Gemini AI** - Akıllı mesaj yanıtları
- **Social Awareness** - Kişilerin konuşma alışkanlıkları + profil analizi
- **Group Handling** - Grup politikaları (mention_only, always, ignore)
- **History Tracking** - Kalıcı mesaj geçmişi
- **Auto-Reconnect** - Sürekli 7/24 çalışma
- **Logs** - Tüm işlemler kaydediliyor

---

## 📱 Termux Kurulumu

### 1️⃣ Termux Yükle

**Android telefonundan:**
- F-Droid uygulamasını aç: https://f-droid.org
- "Termux" ara ve yükle
- **VEYA** Google Play'den (resmi olmayan fork)

### 2️⃣ Gerekli Paketleri Yükle

Termux'u aç ve şu komutları çalıştır:

```bash
# Sistem güncellemeleri
pkg update && pkg upgrade

# Node.js yükle
pkg install nodejs

# Python (ffmpeg için gerekli)
pkg install python

# İsteğe bağlı: nano editör (config düzenlemek için)
pkg install nano

# İsteğe bağlı: pm2 (7/24 çalışma için)
npm install -g pm2
```

**Versiyon kontrol:**
```bash
node --version    # v16+ olmalı
npm --version     # v7+ olmalı
```

### 3️⃣ Proje Dosyalarını Kopyala

Termux'ta:

```bash
# Ana klasör
mkdir -p ~/whatsapp-ai-agent
cd ~/whatsapp-ai-agent

# termux-agent.js dosyasını buraya kopyala
# (GitHub'dan indir veya transfer yöntemi kullan)
```

**Dosya transfer yolları:**

**A) SSH ile (bilgisayardan):**
```bash
scp termux-agent.js user@phone-ip:~/whatsapp-ai-agent/
```

**B) Curl ile (Termux'ta):**
```bash
curl -o termux-agent.js https://raw.githubusercontent.com/yourrepo/termux-agent.js
```

**C) Elle (Termux'ta editör açıp yapıştır):**
```bash
nano termux-agent.js
# Yapıştır, Ctrl+O (kaydet), Ctrl+X (çık)
```

### 4️⃣ Bağımlılıkları Yükle

```bash
cd ~/whatsapp-ai-agent

npm init -y

npm install whatsapp-web.js axios qrcode-terminal
```

**Termux'ta Chrome/Chromium gerekliyse:**
```bash
# Chromium yükle (chromium paketinin Termux versiyonu)
# Genelde whatsapp-web.js otomatik indirir
```

---

## ⚙️ Konfigürasyon

### İlk Kurulum

```bash
# Agentti ilk kez çalıştır
cd ~/whatsapp-ai-agent
node termux-agent.js
```

**Beklenen çıktı:**
```
📱 Scan QR code with WhatsApp:
[QR kod gösterilecek]
```

Telefonunuzda WhatsApp'ı açıp **Settings → Linked Devices** → QR kodu tarayın.

**Hata alırsan:**
```
⚠️ Setup required:
1. Edit: /root/.whatsapp-agent-termux/config.json
2. Add your Gemini API key
3. Restart agent
```

### Config Dosyasını Düzenle

Termux'ta:

```bash
nano ~/.whatsapp-agent-termux/config.json
```

**Gerekli ayarlar:**

```json
{
  "gemini": {
    "apiKey": "YOUR_GEMINI_API_KEY_HERE",  // ← BİLG BURAYA
    "model": "gemini-2.5-flash",
    "temperature": 0.7
  },
  "messageHandling": {
    "autoReplyEnabled": true,
    "groupHandling": "mention_only",  // Nasıl davran?
    "learningMode": true
  },
  "storage": {
    "historyLimit": 100,             // Kaç mesaj saklansın?
    "logLevel": "info"               // Log seviyesi
  },
  "personalization": {
    "name": "Şamil",
    "personality": "chill and casual 8th grader",
    "interests": "anime, games, tech, psychology"
  }
}
```

**`groupHandling` seçenekleri:**
- `"mention_only"` - Grupta bot etiketlenirse cevap ver
- `"always"` - Tüm grup mesajlarına cevap ver
- `"ignore"` - Grup mesajlarını görmezden gel

### Gemini API Key Alma

1. https://ai.google.dev → **Get API Key** tıkla
2. "Create API Key" seç (Google hesap gerekli)
3. Key'i kopyala ve config.json'a yapıştır

---

## 🚀 Çalıştırma

### Manuel Olarak

```bash
cd ~/whatsapp-ai-agent
node termux-agent.js
```

**Loglar:**
```
✅ Agent running...
📍 Config: /root/.whatsapp-agent-termux/config.json
📊 History: /root/.whatsapp-agent-termux/history.json
📝 Logs: /root/.whatsapp-agent-termux/agent.log
```

### PM2 ile (Önerilen - 7/24 Çalışma)

PM2, uygulamanızı arka planda tutup otomatik yeniden başlatır.

```bash
# PM2 global yükle
npm install -g pm2

# Agentti PM2 ile başlat
pm2 start termux-agent.js --name whatsapp-agent

# PM2 startup'ı ayarla (cihaz önyükleme sonrasında otomatik başlat)
pm2 startup
pm2 save

# Durum kontrol et
pm2 status

# Logları görüntüle
pm2 logs whatsapp-agent

# Stop/Restart
pm2 stop whatsapp-agent
pm2 restart whatsapp-agent
```

### Cron ile (7/24 Çalışma - Alternatif)

Eğer PM2 kullanmazsan cron job kullan:

```bash
# Crontab editörünü aç
crontab -e

# Şu satırı ekle (her önyüklemede başlat):
@reboot cd /root/whatsapp-ai-agent && node termux-agent.js >> /root/.whatsapp-agent-termux/agent.log 2>&1 &

# Ctrl+O (kaydet), Ctrl+X (çık)

# Crontab'ı kontrol et
crontab -l
```

---

## 📊 Veriler ve Loglar

Agent tüm verileri Termux'ta şu klasöre kaydeder:

```
~/.whatsapp-agent-termux/
├── config.json          # Yapılandırma
├── history.json         # Mesaj geçmişi (JSON)
├── session/             # WhatsApp oturumu
└── agent.log           # İşlem logları
```

### Logları Takip Et

**Canlı olarak (güncellemeler görmek için):**
```bash
tail -f ~/.whatsapp-agent-termux/agent.log
```

**Son 50 satırı görüntüle:**
```bash
tail -50 ~/.whatsapp-agent-termux/agent.log
```

**Belirli bir hatayı ara:**
```bash
grep "error\|ERROR" ~/.whatsapp-agent-termux/agent.log
```

### Geçmiş Verileri İnceleme

```bash
# Mesaj geçmişini görüntüle (formatted)
cat ~/.whatsapp-agent-termux/history.json | jq .

# Sadece konuşmaları görmek için
cat ~/.whatsapp-agent-termux/history.json | jq '.[] | "\(.senderName): \(.content)"'
```

---

## 🔧 Sorun Giderme

### ❌ "whatsapp-web.js not installed"

```bash
cd ~/whatsapp-ai-agent
npm install whatsapp-web.js axios qrcode-terminal
```

### ❌ "Gemini API key not configured"

```bash
nano ~/.whatsapp-agent-termux/config.json
# apiKey alanını doldurup kaydet
```

### ❌ "Chrome/Chromium not found"

whatsapp-web.js otomatik Chromium'u indirmeli. Eğer hata devam ederse:

```bash
npm install puppeteer-core
```

### ❌ Aracı yeniden bağlanmıyor

```bash
# Oturumu sil ve yeniden başlat
rm -rf ~/.whatsapp-agent-termux/session/*
node termux-agent.js
# QR kodu yeniden tara
```

### ❌ Aracı PM2'de duruyor

```bash
# PM2 loglarını kontrol et
pm2 logs whatsapp-agent

# Hata varsa
pm2 delete whatsapp-agent
npm install  # Bağımlılıkları yeniden yükle
pm2 start termux-agent.js --name whatsapp-agent
```

### ❌ Mesajlara yanıt vermiyor

**Kontrol listesi:**

1. **Gemini bağlantısı:**
   ```bash
   grep "Gemini" ~/.whatsapp-agent-termux/agent.log
   ```

2. **Grup politikası:**
   ```bash
   cat ~/.whatsapp-agent-termux/config.json | jq .messageHandling.groupHandling
   ```

3. **WhatsApp bağlantısı:**
   ```bash
   grep "ready\|Disconnected" ~/.whatsapp-agent-termux/agent.log
   ```

---

## 💡 İpuçları ve Tricks

### Termux Kapatıldığında Çalışmaya Devam Etme

1. **PM2 Boot Setup:**
   ```bash
   pm2 startup
   pm2 save
   ```

2. **Termux Gözetim Modu** - Termux'u arka planda tutma:
   - Termux ayarlarında "Keep CPU on" etkinleştir

3. **Android Batarya Optimizasyonu Kapat:**
   - Settings → Battery → WhatsApp/Termux → "Optimize"i kapat

### Termux'ta Bildirim Al

WhatsApp Web bildirimler otomatik gelmez. Alternatif:

```bash
# opsiyonel: ntfy ile bildir (web hook)
# config.json'a webhoo ekle
```

### Config Sıfırla

```bash
rm ~/.whatsapp-agent-termux/config.json
# Agentti başlat - varsayılan config oluşturulacak
node termux-agent.js
```

### Android Başlangıcında Otomatik Başlatma

**Seçenek 1: PM2 (Tercihlenen)**
```bash
pm2 startup
pm2 save
```

**Seçenek 2: Cron**
```bash
crontab -e
# @reboot cd /root/whatsapp-ai-agent && node termux-agent.js >> /root/.whatsapp-agent-termux/agent.log 2>&1 &
```

---

## 📈 Özellikleri Kontrol Et

### Social Awareness - Çalışıyor mı?

```bash
# Geçmişi kontrol et - gönderenler ve istatistikler
cat ~/.whatsapp-agent-termux/history.json | jq '.[-5:]'
# Son 5 mesaj ve gönderenleri göstermelidir
```

### Gemini - Çalışıyor mı?

```bash
# Log'ları kontrol et
grep "Gemini\|Processing" ~/.whatsapp-agent-termux/agent.log | tail -10
```

### Grup Politikası - Çalışıyor mı?

```bash
# Config'i kontrol et
cat ~/.whatsapp-agent-termux/config.json | jq .messageHandling

# Log'larda davranış
grep "processing\|Skipping\|Group" ~/.whatsapp-agent-termux/agent.log
```

---

## 📞 Destekli Komutlar Özeti

```bash
# Temel
node termux-agent.js                    # Manuel başlat
pm2 start termux-agent.js               # PM2 ile başlat
pm2 stop whatsapp-agent                 # Durdur
pm2 restart whatsapp-agent              # Yeniden başlat
pm2 delete whatsapp-agent               # Sil
pm2 status                              # Durum kontrol

# Config
nano ~/.whatsapp-agent-termux/config.json   # Düzenle
cat ~/.whatsapp-agent-termux/config.json    # Görüntüle

# Loglar
tail -f ~/.whatsapp-agent-termux/agent.log  # Canlı tak
tail -50 ~/.whatsapp-agent-termux/agent.log # Son 50 satır
grep "error" ~/.whatsapp-agent-termux/agent.log  # Hataları ara

# Veriler
cat ~/.whatsapp-agent-termux/history.json | jq   # Geçmiş

# Oturum
rm -rf ~/.whatsapp-agent-termux/session/*   # Oturum sıfırla
```

---

## 🎯 Sonraki Adımlar

1. **Config optimize et:**
   - Gemini sıcaklığını (temperature) ayarla (0-1 arası)
   - Grup politikasını seç
   - History limitini ayarla

2. **Kişiselleştir:**
   - `personalization` bölümünde adını, kişiliği, ilgileri ayarla
   - System prompt'u (`SYSTEM_INSTRUCTION` bölümü) Termux agentte düzenle

3. **7/24 Operasyon:**
   - PM2 root startup yapılandır
   - Termux'u arka planda tutacak şekilde ayarla

4. **Düzenli Bakım:**
   - Logları haftalık kontrol et
   - İşlemleri `pm2 logs` ile takip et
   - Oturumu ayda bir sıfırla

---

## ⚠️ Dikkatli Olun

- **API Limitleri:** Gemini free tier günde ~15,000 istek. Öğrenme modunu on ise yanıtlara dikkat et.
- **Batarya:** Cihaz kapatılırsa agent kapanır. PM2 otomatik başlat ayarını kullan.
- **RAM:** Termux'un RAM'e göre chromium boyutunu ayarla (performanceMode: true yap).
- **Internet:** 7/24 çalışması için WiFi veya sabit veri bağlantısı gerekli.

---

## 📚 Ek Kaynaklar

- [Termux Wiki](https://wiki.termux.com/)
- [PM2 Docs](https://pm2.keymetrics.io/)
- [whatsapp-web.js Docs](https://docs.openwa.dev/)
- [Gemini API](https://ai.google.dev/)

---

**Hazır mısın? Başla:**

```bash
cd ~/whatsapp-ai-agent
node termux-agent.js
```

Haz Ibe! 🚀
