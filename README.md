# FlashGPT - Din AI-assistent för flashback.org

<p align="center">
  <img src="FlashGPT1.png" alt="FlashGPT Gränssnitt" width="45%">
  <img src="FlashGPT2.png" alt="Exempel på analys" width="45%">
</p>


**FlashGPT** är ett verktyg för att snabbt analysera och sammanfatta forumtrådar på **Flashback**. Istället för att manuellt plöja igenom hundratals inlägg kan du skrapa trådar och få en sammanfattning direkt. Perfekt för att snabbt få en överblick över heta diskussioner.

## Funktioner

- ** Skrapa valfria Flashback-trådar** – Ange en URL och få en sammanfattning.
- ** Populära trådar** – Få en lista över de mest aktiva trådarna just nu.
- ** AI-analys** – Använder **OpenAI** och **Gemini** för att generera sammanfattningar.
- ** Snabb & effektiv** – Slipp läsa 1000+ inlägg, få kärnan direkt.

##  Installation & Körning

### 1️ Klona repot
```sh
git clone https://github.com/elfgren89/FlashGPT.git
cd FlashGPT
```

### 2️ Lägg till API-nycklar i `.env`
Skapa en `.env`-fil i `backend/` baserat på `.env.example` och fyll i dina egna API-nycklar för OpenAI och Gemini.

```env
OPENAI_API_KEY=din_openai_nyckel
GEMINI_API_KEY=din_gemini_nyckel
```

---

###  3️ Kör manuellt (utan Docker)
Om du vill köra direkt på din dator:

#### Backend
```sh
cd backend
npm install
node server.js
```

#### Frontend
```sh
cd frontend
npm install
npm start
```

### 4 Öppna i webbläsaren
- **Frontend** körs på: [http://localhost:3000](http://localhost:3000)
- **Backend** körs på: [http://localhost:5000](http://localhost:5000)

---


## Användning med Docker Hub

Om du vill använda den färdigbyggda versionen från **Docker Hub**:

**Ladda ner FlashGPT direkt från Docker Hub**
```sh
docker pull elfgren89/flashgpt:latest

```
**Kör igång FlashGPT**
```sh
docker run -d --name flashgpt -p 3000:3000 -p 5000:5000 -e GEMINI_API_KEY=your_gemini_key_here -e USE_GEMINI=true elfgren89/flashgpt

```
(Byt ut your_gemini_key_here till din faktiska nyckel! Gratis nyckel kan hämtas här: https://aistudio.google.com/app/apikey)





---

## Användning med Docker

### Bygg & starta lokalt (utan att använda Docker Hub)
Om du vill köra lokalt utan att hämta från Docker Hub:

```sh
docker build -t elfgren89/flashgpt -f Dockerfile .
docker-compose -p flashgpt up -d --build
```



## Teknisk översikt

| Komponent   | Teknologi |
|-------------|----------|
| **Frontend**  | React|
| **Backend**   | Node.js, Express, Cheerio (för web scraping) |
| **Datakällor** | Flashback.org |
| **AI-modeller** | OpenAI GPT & Gemini |

---
