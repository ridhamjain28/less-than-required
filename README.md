# ⚡ Less Than Required

A Chrome extension that automatically detects file upload size limits on websites and helps you compress files to meet those requirements – all without leaving the page.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🔍 Smart Limit Detection
- Automatically scans page content (titles, headers, labels) for file size limits
- Detects patterns like "Max 5MB", "Limit: 2MB", "< 10MB"
- Shows detected limit in the notification

### 🗜️ Intelligent Compression
- **Images**: Compresses via JPEG engine, converts back to original format (PNG stays PNG)
- **PDFs**: Basic optimization using pdf-lib
- **Quality Control**: Choose High (90%), Medium (70%), or Low (50%) compression

### 🎨 Beautiful UI
- Modern gradient design with smooth animations
- Non-intrusive toast notifications
- Stats dashboard showing Before/After/% Saved
- One-click download of compressed files

### 🚀 How It Works
1. **Upload a file** on any website with a file size limit
2. **Extension detects** if your file exceeds the limit
3. **Click "Compress"** – file is optimized instantly
4. **Done!** The compressed file replaces the original in the upload form

---

## 📦 Installation

### From Source (Developer Mode)

1. **Clone this repository**
   ```bash
   git clone https://github.com/ridhamjain28/less-than-required.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)

3. **Load the extension**
   - Click **"Load unpacked"**
   - Select the `less-than-required` folder

4. **Pin the extension** for easy access

---

## 🎯 Usage

### Popup (Manual Compression)
1. Click the extension icon in your toolbar
2. Drag & drop any image or PDF
3. Select compression quality
4. Download the compressed file

### On Websites (Automatic)
1. Go to any website with a file upload (e.g., form with "Max 5MB" limit)
2. Select a file that's too large
3. A notification appears: "Large File Detected!"
4. Click **"🔥 Compress"**
5. The file is automatically replaced with the compressed version
6. Optionally click **"⬇️ Save Copy"** to download

---

## 🛠️ Tech Stack

- **Manifest V3** – Latest Chrome extension standard
- **Vanilla JavaScript** – No frameworks, lightweight
- **Canvas API** – Client-side image compression
- **pdf-lib** – PDF manipulation
- **Chrome Storage API** – Saves user preferences

---

## 📁 Project Structure

```
less-than-required/
├── manifest.json          # Extension configuration
├── src/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   ├── content_script.js  # Injected page script
│   ├── background.js      # Service worker
│   └── utils/
│       ├── compressor.js  # Image/PDF compression
│       └── pdf-lib.min.js # PDF library
├── test.html              # Local test page
└── README.md
```

---

## 🔧 Configuration

Quality settings are saved automatically:
- **High (90%)** – Minimal quality loss, larger files
- **Medium (70%)** – Balanced (recommended)
- **Low (50%)** – Maximum compression, some quality loss

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

MIT License – feel free to use and modify.

---

## 👨‍💻 Author

Made with ❤️ by [Ridham Jain](https://github.com/ridhamjain28)

---

**⭐ Star this repo if you find it useful!**
