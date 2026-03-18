
Цель: сделать реакцию камеры на мышь заметно живее и убрать лаги при движении мыши/скролле, при этом скрыть «низкополигональность» при сближении.

1) Диагностика (что уже подтверждено)
- По CPU-профилю основные горячие точки при интеракции:  
  - `CursorLayer.tsx` (rAF-цикл курсора)  
  - `use-pointer-parallax.ts` (бесконечный rAF-цикл)
- В `HeroStageWebGL.tsx` `frameloop="demand"` не «просыпается» напрямую от `pointermove`, из-за чего старт реакции на мышь может ощущаться с задержкой.
- Видимые полигоны усиливаются из-за слишком близких участков камеры + широкого FOV для low-poly сцены.

2) Что реализовать

A. Повысить интерактивность камеры (по запросу)
- Файл: `src/components/dossier-hero/hero-scene.config.ts`
  - Увеличить `POINTER_RANGES` (scene/artifact/camera) примерно на 25–40% для более выраженного parallax.
- Файл: `src/components/experience/use-experience-runtime.ts`
  - Ускорить pointer-lerp (сделать более отзывчивым), и перевести его на delta-нормализованный коэффициент, чтобы отклик не «проваливался» при просадках FPS.

B. Убрать лаги при движении мыши
- Файл: `src/components/dossier-hero/HeroStageWebGL.tsx`
  - Добавить `pointermove`-wake invalidation (throttled через rAF), чтобы `frameloop="demand"` сразу реагировал на движение мыши.
  - Уменьшить порог `pointerMoved` (epsilon), чтобы не было микроподвисаний на мелких движениях.
- Файлы:  
  - `src/components/experience/CursorLayer.tsx`  
  - `src/hooks/use-pointer-parallax.ts`
  - Перевести бесконечные rAF-циклы на on-demand режим: запуск при движении, авто-стоп после стабилизации (settled state). Это снимет лишнюю нагрузку с main thread.

C. Скрыть «фасетки» low-poly при приближении
- Файл: `src/components/dossier-hero/hero-scene.config.ts`
  - Отодвинуть ближайшие контрольные точки `CAMERA_CURVE_POINTS` (и немного поднять Y), чтобы исключить экстремальные close-up.
  - Немного сузить FOV (например, `40 -> 36/37`) для более «кинематографичного» кадра и меньшей заметности полигонов.

D. Баланс качества/производительности
- Файл: `src/components/dossier-hero/HeroStageWebGL.tsx`
  - Добавить device-aware quality guard (например, ограничение max DPR и/или упрощение эффектов для слабых устройств), чтобы сохранить плавность при активной мыши без сильной потери качества.

3) Проверка после внедрения
- Прогнать сценарий: быстрые движения мыши + полный скролл hero-секции.
- Замерить до/после:
  - `browser--performance_profile`
  - `browser--start_profiling` → воспроизведение → `browser--stop_profiling`
- Критерии приёмки:
  - камера реагирует сразу, без ощутимого «догоняния»;
  - при активной мыши нет заметных подлагиваний;
  - близкие ракурсы больше не оголяют low-poly так явно;
  - визуал остаётся качественным на десктопе.
- Если после этих правок полигоны всё ещё бросаются в глаза: это уже ограничение самого GLB, следующий шаг — замена/апгрейд ассета (более плотная геометрия или baked normal details).

4) Файлы, которые будут изменены
- `src/components/dossier-hero/hero-scene.config.ts`
- `src/components/experience/use-experience-runtime.ts`
- `src/components/dossier-hero/HeroStageWebGL.tsx`
- `src/components/experience/CursorLayer.tsx`
- `src/hooks/use-pointer-parallax.ts`
