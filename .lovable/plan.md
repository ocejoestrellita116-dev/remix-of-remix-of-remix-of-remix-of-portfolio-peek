

## Точечная оптимизация 3D-сцены: Z-fighting, материалы, освещение

### Проблема
Белые пятна на стыках объектов (кактус/горшок, элементы стола) — это Z-fighting: два полигона находятся на одинаковой глубине, и GPU не может определить, какой рисовать поверх.

### 1. Камера: сужение depth range

**Файл**: `hero-scene.config.ts`, строки 55-60

Текущий `near: 0.1, far: 50` даёт depth ratio 500:1. Сцена компактна (объекты в радиусе ~5 единиц), поэтому можно безопасно сузить:

```
near: 0.5, far: 25
```

Это увеличивает точность depth buffer в ~5 раз и устраняет бОльшую часть Z-fighting.

### 2. Материалы: polygonOffset + specular контроль

**Файл**: `use-glb-loader.ts`, в блоке обработки `MeshStandardMaterial` (строки 48-73)

Для каждого меша добавить `polygonOffset` — это сдвигает глубину на субпиксельный уровень, разрешая конфликты:

```typescript
stdMat.polygonOffset = true;
stdMat.polygonOffsetFactor = 1;
stdMat.polygonOffsetUnits = 1;
```

Для контроля specular highlights (белые блики):
- Ограничить `metalness` до max 0.85 (убирает избыточные отражения)
- Уже есть снижение `roughness`, этого достаточно

### 3. Освещение: shadow bias + интенсивность

**Файл**: `hero-scene.config.ts`

- `shadowBias`: изменить с `-0.0005` на `-0.002` — убирает "зубчатые" белые края теней
- `shadow-mapSize`: уже 512 — оптимально
- Key light `intensity: 2.4` — высоковато, снизить до `2.0` для уменьшения пересвеченных зон

### 4. Tone mapping

**Файл**: `HeroStageWebGL.tsx`

Текущий `toneMappingExposure: 1.5` усиливает яркие зоны. Снизить до `1.2` — это программно "скрывает" артефакты, делая переходы мягче.

### 5. Чистка мёртвого кода

Файлы, которые не нужны при сохранении Three.js-архитектуры, но можно удалить:
- `src/test/hero-technical-qa.test.ts` — ссылается на удалённый ранее экспорт (если тесты уже ломались)
- `orb`-логика в `use-scene-animation.ts` (строки 147-152) — нет узла `orb` в NODE_MAP, это мёртвый код

### Сводка изменений

| Файл | Что меняется |
|------|-------------|
| `hero-scene.config.ts` | `near: 0.5`, `far: 25`, `shadowBias: -0.002`, key light `intensity: 2.0` |
| `use-glb-loader.ts` | Добавить `polygonOffset` + ограничить `metalness ≤ 0.85` |
| `HeroStageWebGL.tsx` | `toneMappingExposure: 1.2` |
| `use-scene-animation.ts` | Удалить мёртвую `orb`-логику (строки 147-152) |

