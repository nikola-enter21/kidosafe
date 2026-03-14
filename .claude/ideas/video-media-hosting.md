# Видео / Медия — Как работи URL системата

## Идеята
В базата пазим само **URL пътя** до видеото/снимката.
Файловете живеят на сървъра (или CDN). Браузърът ги зарежда по URL.

---

## Dev среда (сега)

```
frontend/public/
  videos/
    candie.mp4      ← физически файл тук
  images/
    tip-home.png
```

Vite сервира `public/` директно като статик на `http://localhost:5173`.

В базата пазим:
```
video_url = "/videos/candie.mp4"
```

Браузърът го чете като относителен URL → `http://localhost:5173/videos/candie.mp4` ✅

**За да добавиш ново видео:**
1. Копирай `.mp4` файла в `frontend/public/videos/`
2. В Content Studio → Video URL → `/videos/твоето-видео.mp4`
3. Save → запазено в базата → зарежда се в играта

---

## Production (когато deploy-ваш)

### Вариант А — Django Media (препоръчително за собствен сървър)

В `settings.py`:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

В `urls.py`:
```python
from django.conf import settings
from django.conf.urls.static import static
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

Файловете живеят в `backend/media/videos/`.
В базата: `video_url = "/media/videos/candie.mp4"` (абсолютен URL към бекенда).

### Вариант Б — CDN / S3 (за scale)
```
video_url = "https://cdn.kidosafe.com/videos/candie.mp4"
```
Работи без промени — просто absolute URL в базата.

### Вариант В — Nginx static (прост deploy)
Nginx сервира `frontend/dist/` (включва `public/`) → `/videos/candie.mp4` пак работи.

---

## Обобщение

| Среда | Където е файлът | URL в базата |
|-------|----------------|--------------|
| Dev (Vite) | `frontend/public/videos/` | `/videos/xxx.mp4` |
| Prod (Django media) | `backend/media/videos/` | `/media/videos/xxx.mp4` |
| Prod (CDN) | S3 / Cloudflare | `https://cdn.xxx.com/videos/xxx.mp4` |

Кодът в `SceneDisplay.tsx` и `FeedbackOverlay.tsx` работи и с трите — просто чете `src={videoUrl}`.
