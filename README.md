# Timeline Mar & Jose

Línea de tiempo privada de momentos de una pareja: cada momento es una foto con
lugar, canción, valoración y una reseña por persona.

## Stack

- **Next.js 16** (App Router) con `output: "export"` — se compila a HTML/CSS/JS
  estático, sin servidor en producción
- **React 19**, **TypeScript** (modo relajado, `strict: false`)
- **Tailwind CSS 4** + **daisyUI 5**
- **Swiper 14** para el carrusel de momentos
- **Firebase**: Auth, Firestore (en tiempo real con `onSnapshot`) y Storage
- Una **Cloud Function** que busca canciones en Spotify sin exponer las claves

## Desarrollo

```bash
npm install
npm run dev
```

En http://localhost:3000.

## Compilar

```bash
npm run build
```

Genera el sitio estático en `out/`.

## Despliegue

Netlify, con la configuración en [netlify.toml](netlify.toml) (build `npm run build`,
publish `out/`). Ese archivo manda sobre lo que haya configurado en la interfaz de Netlify.

La Cloud Function se despliega aparte:

```bash
cd functions && npm run deploy
```

Necesita `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` en `functions/.env`.

## Estructura

```
app/          layout, página y estilos globales
components/   UI: hero, timeline, modales
hooks/        useTimeline (datos en vivo), useHeroBackground
lib/          Firebase, acceso a datos, formato, utilidades
types/        modelo de datos compartido
public/       fotos de los momentos de fase 1, avatares y fondos
functions/    Cloud Function de búsqueda en Spotify
scripts/      utilidades puntuales
```

## Modelo de datos

```
users/{uid}                            email, displayName, genre, activeCoupleId
couples/{coupleId}                     code, title, members[], displayNames{}, genres{}, lastMomentIndex
couples/{coupleId}/moments/{momentId}  title, place, sex, timestamp, urlImg, song{}, new,
                                       createdBy, participants{uid: {description, feeling, rating, ...}}
```

### Momentos de fase 1

Los momentos anteriores a la app (`new` distinto de `true`) no tienen `urlImg`:
sus fotos viven en `public/assets/img/{n}`, donde `n` es el `visualIndex` del
momento menos uno. Esa correspondencia es estable porque ningún momento nuevo
puede tener fecha anterior a ellos.

Para regenerar la lista de rutas de `lib/constants.ts`:

```bash
python scripts/list-legacy-images.py
```
