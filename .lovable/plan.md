

## Оставшиеся белые пятна: диагностика и план исправления

### Причина

Скриншоты показывают Z-fighting на стыках объектов: кактус/горшок, персонаж/база, камера/стол. Предыдущий fix применил одинаковый `polygonOffset(1, 1)` ко **всем** материалам — но когда два меша с одинаковым offset пересекаются, конфликт сохраняется. Нужен дифференцированный подход.

### Изменения

#### 1. Логарифмический depth buffer (`HeroStageWebGL.tsx`)

Заменяет линейный depth buffer на логарифмический — экспоненциально увеличивает точность вблизи камеры, где находятся все объекты.

```typescript
// Canvas gl prop:
logarithmicDepthBuffer: true
```

Это самый эффективный способ убрать Z-fighting без изменения модели.

#### 2. Дифференцированный polygonOffset по группам (`use-glb-loader.ts`)

Вместо одинакового offset для всех — разный для каждой группы:

| Группа | polygonOffsetFactor | Логика |
|--------|-------------------|--------|
| `heroArtifact` (levelBase, sudo) | 0 | Основа — нулевой offset |
| `support` (cactus, pyramid, camera) | 2 | Стоят поверх базы |
| `atmosphere` (reactLogo) | 3 | Самый дальний слой |

#### 3. Увеличить shadow bias (`hero-scene.config.ts`)

Текущий `-0.002` всё ещё даёт белые края на тенях. Увеличить до `-0.003` и добавить `normalBias: 0.02` для мягкого смещения по нормали.

#### 4. Снизить envMapIntensity (`use-glb-loader.ts`)

Текущий порог `envMapIntensity < 1 → set 1` может создавать яркие пятна на гладких поверхностях. Оставить оригинальное значение из GLB, убрать принудительное повышение.

### Файлы

| Файл | Изменение |
|------|-----------|
| `HeroStageWebGL.tsx` | Добавить `logarithmicDepthBuffer: true` в Canvas gl |
| `use-glb-loader.ts` | Дифференцированный polygonOffset по группам, убрать принудительный envMapIntensity |
| `hero-scene.config.ts` | `shadowBias: -0.003`, добавить `normalBias: 0.02` |
| `SceneLighting.tsx` | Применить `shadow-normalBias` из конфига |

