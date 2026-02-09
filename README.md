# Reversi (Othello) con IA Minimax

Este proyecto es una implementación completa del juego de mesa Reversi (Othello). Cuenta con una arquitectura híbrida única que permite jugar tanto conectado a un backend de Python como en modo totalmente offline en el navegador.

**IMPORTANTE:** Este proyecto **NO** requiere ninguna API Key de Google ni servicios de terceros. La inteligencia artificial es un algoritmo lógico (Minimax con poda Alfa-Beta) que se ejecuta localmente.

## Tecnologías

- **Frontend:** React, TypeScript, Tailwind CSS.
- **Backend:** Python, FastAPI, Pydantic.
- **IA:** Algoritmo Minimax con Poda Alfa-Beta (implementado tanto en Python como en TypeScript para redundancia).

## Cómo ejecutar el proyecto

### 1. Frontend (La interfaz del juego)

Para iniciar la aplicación web:

```bash
# Instalar dependencias de Node.js
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:5173` (o el puerto que indique la consola).

*Nota: Si solo ejecutas este paso, el juego funcionará en "Modo Offline" usando la IA integrada en el navegador.*

### 2. Backend (Lógica en Python) - Opcional

Si deseas que la lógica y la IA sean procesadas por el servidor de Python (como se solicitó originalmente):

1. Asegúrate de tener Python instalado.
2. Instala las dependencias necesarias:

```bash
pip install fastapi uvicorn pydantic
```

3. Ejecuta el servidor:

```bash
uvicorn backend:app --reload
```

El servidor correrá en `http://localhost:8000`.

## ¿Cómo funciona la conexión?

El Frontend está programado para intentar conectarse automáticamente a `http://localhost:8000`. 
- Si el backend de Python está activo, las jugadas se procesan allí.
- Si el backend NO está activo (o falla la conexión), el juego cambia silenciosamente a la lógica interna de TypeScript (Modo Offline) para que puedas seguir jugando sin interrupciones.
