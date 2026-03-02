# 📄 File Converter & Compressor

A web app to convert and compress files:
- **PDF → Word** (.pdf to .docx)
- **Word → PDF** (.docx to .pdf)
- **File Compression** (PDF, JPG, PNG)

---

## 🛠️ Prerequisites

Install these before running:

1. **Node.js** (v18+) → https://nodejs.org
2. **LibreOffice** → https://www.libreoffice.org
   - macOS: `brew install libreoffice`
   - Ubuntu: `sudo apt install libreoffice`
3. **Ghostscript** → https://ghostscript.com
   - macOS: `brew install ghostscript`
   - Ubuntu: `sudo apt install ghostscript`

---

## 🚀 How to Run Locally

### Start the Backend (Terminal 1)
```bash
cd server
npm install
node index.js
```
Server runs on http://localhost:5000

### Start the Frontend (Terminal 2)
```bash
cd client
npm install
npm start
```
App opens at http://localhost:3000

---

## 📁 Project Structure

```
project/
├── client/         # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   │   ├── PdfToWord.js
│   │   │   ├── WordToPdf.js
│   │   │   ├── Compressor.js
│   │   │   ├── DropZone.js
│   │   │   └── Spinner.js
└── server/         # Node.js backend
    └── index.js
```
