# Mi Pensión MX — Calculadora de Pensión IMSS Ley 73

Aplicación móvil desarrollada con **React Native + Expo + TypeScript** para estimar pensiones bajo la **Ley del Seguro Social de 1973 (Ley 73)**.

> ⚠️ **AVISO LEGAL**: Esta aplicación proporciona **ESTIMACIONES** con fines informativos únicamente. La resolución oficial de cualquier pensión corresponde exclusivamente al IMSS conforme a sus procedimientos institucionales. Los cálculos se basan en la Ley del Seguro Social de 1973 y valores de referencia (UMA, SMG) que pueden diferir de los criterios operativos del IMSS en cada caso particular. Acuda a la Subdelegación del IMSS correspondiente para información oficial.

---

## 📋 Características

- **Calculadora de pensión Ley 73** con todas las reglas oficiales:
  - Cuantía básica (Art. 167 LSS 1973)
  - Incrementos anuales por semanas excedentes
  - Factor por edad (Cesantía en Edad Avanzada, Arts. 138–140)
  - Asignaciones familiares (Arts. 163–164)
  - Ayuda asistencial (Art. 165)
  - Pensión Mínima Garantizada (Art. 170)
  - Tope de 25 UMA (Art. 28 LSS vigente)
  - Ajuste por Modalidad 40 (Art. 218 Reglamento LSS)

- **Simulador de escenarios A vs B** con comparación detallada
- **Historial** de las últimas 20 simulaciones (AsyncStorage)
- **Importación de Constancia IMSS** en PDF con extracción automática de datos
- **Exportación a PDF** del reporte completo
- **Modo claro y oscuro** (Material Design 3)
- **Sección educativa** sobre Ley 73, UMA, Modalidad 40, FAQ

---

## 🏗️ Arquitectura

```
src/
├── models/          # Tipos TypeScript (PensionInput, PensionResult, etc.)
├── constants/       # Tablas Ley 73 (Art. 167), UMA/SMG históricos, textos
├── services/
│   ├── pension/     # Motor de cálculo (pipeline de pasos puros)
│   │   ├── steps/   # AverageSalaryStep, BasicQuantityStep, ...
│   │   └── PensionCalculator.ts  # Orquestador
│   ├── export/      # pdfExport.ts (expo-print + expo-sharing)
│   └── pdf/         # Importación y parsing de PDFs
│       └── parsers/ # PersonalDataParser (Strategy pattern)
├── screens/         # 9 pantallas (Dashboard, Simulation, Result, ...)
├── navigation/      # React Navigation (Stack + BottomTabs)
├── hooks/           # usePensionForm, useHistory
├── theme/           # MD3 claro/oscuro
├── validation/      # Schemas Zod
├── storage/         # AsyncStorage (últimas 20 simulaciones)
└── utils/           # format.ts (Intl), date.ts
```

### Motor de cálculo (Pipeline)

El motor implementa un patrón **Pipeline** donde cada paso es una función pura:

```
Input → AverageSalaryStep → BasicQuantityStep → AnnualIncrementsStep
      → AgeFactorStep → FamilyAssignmentsStep → AssistanceAidStep
      → LimitsStep → PensionResult
```

Cada paso:
- Recibe un `CalculationContext` inmutable
- Devuelve un contexto actualizado
- Genera su propio fragmento del desglose (`PasoCalculo`)
- Documenta supuestos y fuentes legales

---

## 🚀 Instalación y ejecución

### Prerrequisitos

- Node.js 18+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- Expo Go instalado en tu dispositivo (iOS/Android)

### Instalación

```bash
# Clonar el repositorio
cd mi-prension-mx

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
```

Escanea el QR con Expo Go para abrir la aplicación en tu dispositivo.

### Scripts disponibles

```bash
npm start          # Iniciar servidor Expo
npm run ios        # Abrir en simulador iOS (requiere macOS + Xcode)
npm run android    # Abrir en emulador Android
npm run test       # Ejecutar pruebas unitarias
npm run test:watch # Ejecutar pruebas en modo watch
npm run test:coverage  # Generar reporte de cobertura
npm run typecheck  # Verificar tipos TypeScript
```

---

## 🧪 Pruebas unitarias

Las pruebas del motor de cálculo se encuentran en `src/__tests__/pensionCalculator.test.ts`.

```bash
npm test
```

Escenarios cubiertos:
- Validación de entrada (semanas < 500, edad < 60, salario 0)
- Pensión de Vejez (65 años, factor 100%)
- Cesantía en Edad Avanzada (60–64 años, factores 75–95%)
- Incrementos anuales por semanas excedentes
- Asignaciones familiares (cónyuge, hijos)
- Ayuda asistencial (sin beneficiarios)
- Tope de 25 UMA
- Pensión Mínima Garantizada
- Desglose de pasos
- `calcularEscenarioSimple` para el simulador

---

## ⚖️ Base legal

Los cálculos se basan en:

| Artículo | Contenido |
|----------|-----------|
| Arts. 138–140 LSS 1973 | Cesantía en Edad Avanzada y factores de reducción |
| Art. 145 LSS 1973 | Pensión de Vejez |
| Art. 163–164 LSS 1973 | Asignaciones familiares |
| Art. 165 LSS 1973 | Ayuda asistencial |
| Art. 167 LSS 1973 | Tabla de cuantías básicas e incrementos anuales |
| Art. 170 LSS 1973 | Pensión Mínima Garantizada |
| Art. 182 LSS 1973 | Conservación de derechos |
| Art. 28 LSS vigente | Tope 25 UMA del SBC |
| Art. 218 RIR-IMSS | Modalidad 40 |

> **Nota sobre la tabla del Art. 167**: Los porcentajes de cuantía básica e incrementos anuales son de referencia bibliográfica. El IMSS puede aplicar criterios operativos distintos. Los resultados siempre se marcan como ESTIMACIONES.

---

## 🔒 Privacidad

- **Sin backend**: toda la información permanece en el dispositivo
- **Sin login**: sin registro de usuarios
- **Sin base de datos remota**: sin persistencia en servidores
- El historial de simulaciones se guarda únicamente en `AsyncStorage` local
- La importación de PDFs se procesa 100% localmente

---

## 📦 Dependencias principales

| Paquete | Propósito |
|---------|-----------|
| `expo ~52.0.0` | Framework base |
| `react-native-paper ^5` | Componentes MD3 |
| `@react-navigation/*` | Navegación |
| `react-hook-form ^7` | Formularios |
| `zod ^3` | Validación de esquemas |
| `@react-native-async-storage/async-storage` | Historial local |
| `expo-print`, `expo-sharing` | Exportación PDF |
| `expo-document-picker`, `expo-file-system` | Importación PDF |
| `react-native-reanimated ~3` | Animaciones |
| `react-native-chart-kit ^6` | Gráficas |

---

## 🗂️ Estructura de archivos generados

```
mi-prension-mx/
├── App.tsx                          # Punto de entrada
├── index.ts                         # Registro Expo
├── package.json
├── tsconfig.json
├── babel.config.js
├── app.json
├── README.md
└── src/
    ├── __tests__/
    │   └── pensionCalculator.test.ts  # 25+ pruebas unitarias
    ├── models/index.ts
    ├── constants/
    │   ├── uma.ts           # Tabla UMA/SMG 2017-2026
    │   ├── ley73.ts         # Tabla Art.167, factores edad, constantes
    │   ├── infoLegal.ts     # Textos educativos y FAQ
    │   └── index.ts
    ├── utils/
    │   ├── format.ts        # Intl formatters (es-MX)
    │   ├── date.ts          # Utilidades de fechas
    │   └── index.ts
    ├── services/
    │   ├── pension/
    │   │   ├── types.ts
    │   │   ├── steps/
    │   │   │   ├── AverageSalaryStep.ts
    │   │   │   ├── BasicQuantityStep.ts
    │   │   │   ├── AnnualIncrementsStep.ts
    │   │   │   ├── AgeFactorStep.ts
    │   │   │   ├── FamilyAssignmentsStep.ts
    │   │   │   ├── AssistanceAidStep.ts
    │   │   │   └── LimitsStep.ts
    │   │   ├── PensionCalculator.ts
    │   │   └── index.ts
    │   ├── export/
    │   │   └── pdfExport.ts
    │   └── pdf/
    │       ├── PdfImporter.ts
    │       └── parsers/
    │           └── PersonalDataParser.ts
    ├── screens/
    │   ├── DashboardScreen.tsx
    │   ├── NewSimulationScreen.tsx
    │   ├── ResultScreen.tsx
    │   ├── SimulatorScreen.tsx
    │   ├── HistoryScreen.tsx
    │   ├── InfoScreen.tsx
    │   ├── FAQScreen.tsx
    │   ├── PdfImportScreen.tsx
    │   └── ValidationScreen.tsx
    ├── navigation/
    │   └── RootNavigator.tsx
    ├── hooks/
    │   ├── usePensionForm.ts
    │   └── useHistory.ts
    ├── theme/
    │   ├── index.ts          # Temas MD3 claro/oscuro
    │   └── useAppTheme.ts
    ├── validation/
    │   └── pensionSchema.ts  # Esquemas Zod
    └── storage/
        └── simulationStorage.ts  # AsyncStorage
```

---

## 🛠️ Desarrollo futuro

La arquitectura está diseñada para extensión:

- **Otros documentos**: agregar parsers para Estado de cuenta AFORE, Constancia ISSSTE, recibos de nómina implementando la interfaz `DocumentParser<T>`
- **OCR nativo real**: activar `PdfOcrProcessor` con ML Kit en un _development build_ (`expo prebuild`)
- **Cálculo Ley 97**: agregar módulo separado para comparación

---

*Desarrollado con ❤️ — Vieyra Labs*
