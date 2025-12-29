# Scripts Runner

Extensión para VS Code, Windsurf y otros forks de VS Code que permite gestionar y ejecutar scripts personalizados desde un archivo `.scriptsrc` en tu proyecto.

## Características

- 📋 **Vista de árbol** con todos los scripts del proyecto
- ▶️ **Ejecutar scripts** con un solo clic
- ➕ **Agregar scripts** desde la interfaz
- ✏️ **Editar scripts** existentes
- 🗑️ **Eliminar scripts** con confirmación
- 📁 **Categorías** para organizar scripts
- 🔄 **Auto-refresh** cuando cambia el archivo `.scriptsrc`

## Uso

### 1. Crear archivo `.scriptsrc`

Crea un archivo `.scriptsrc` en la raíz de tu proyecto con el siguiente formato:

```json
{
  "scripts": [
    {
      "name": "build",
      "command": "npm run build",
      "description": "Compila el proyecto",
      "category": "Build"
    },
    {
      "name": "test",
      "command": "npm test",
      "description": "Ejecuta los tests"
    },
    {
      "name": "deploy",
      "command": "npm run deploy",
      "description": "Despliega a producción",
      "category": "Deploy"
    }
  ]
}
```

### 2. Propiedades de cada script

| Propiedad | Requerido | Descripción |
|-----------|-----------|-------------|
| `name` | ✅ | Nombre del script |
| `command` | ✅ | Comando a ejecutar |
| `description` | ❌ | Descripción del script |
| `category` | ❌ | Categoría para agrupar scripts |

### 3. Ejecutar scripts

- Haz clic en el icono de **Scripts Runner** en la barra lateral
- Haz clic en cualquier script para ejecutarlo
- También puedes hacer clic derecho para ver más opciones

## Comandos

| Comando | Descripción |
|---------|-------------|
| `Scripts Runner: Run Script` | Ejecuta un script |
| `Scripts Runner: Add Script` | Agrega un nuevo script |
| `Scripts Runner: Edit Script` | Edita un script existente |
| `Scripts Runner: Delete Script` | Elimina un script |
| `Scripts Runner: Refresh Scripts` | Recarga los scripts |
| `Scripts Runner: Create .scriptsrc File` | Crea el archivo de configuración |
| `Scripts Runner: Open .scriptsrc File` | Abre el archivo de configuración |

## Instalación

### Desde código fuente

1. Clona el repositorio
2. Ejecuta `npm install`
3. Ejecuta `npm run compile`
4. Presiona `F5` para abrir una ventana de desarrollo

### Empaquetar extensión

```bash
npm install -g @vscode/vsce
vsce package
```

Esto generará un archivo `.vsix` que puedes instalar en VS Code, Windsurf u otros forks.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar
npm run compile

# Watch mode
npm run watch

# Lint
npm run lint
```

## Licencia

MIT
