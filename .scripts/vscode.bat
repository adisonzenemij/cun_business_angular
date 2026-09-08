@echo off
setlocal EnableExtensions DisableDelayedExpansion

rem Ruta central que contiene los workspaces compartidos.
rem Al copiar este archivo a otro proyecto, conserve esta ruta.
set "CENTRAL_ROOT=D:\Engineering\Software\spacing\github\adisonzenemij\d88676c1fd0a"

rem Si el .bat esta en .scripts, se abre su carpeta padre. Si esta en la raiz
rem de un proyecto copiado, se abre esa misma carpeta.
for %%I in ("%~dp0.") do set "SCRIPT_DIRECTORY=%%~fI"
for %%I in ("%SCRIPT_DIRECTORY%") do set "SCRIPT_DIRECTORY_NAME=%%~nxI"
if /I "%SCRIPT_DIRECTORY_NAME%"==".scripts" (
    for %%I in ("%SCRIPT_DIRECTORY%\..") do set "TARGET_PROJECT=%%~fI"
) else (
    set "TARGET_PROJECT=%SCRIPT_DIRECTORY%"
)

set "MISSING_WORKSPACE=0"
for %%W in (
    "%CENTRAL_ROOT%\backend\java\vs.code-workspace"
    "%CENTRAL_ROOT%\backend\php\vs.code-workspace"
    "%CENTRAL_ROOT%\backend\python\vs.code-workspace"
    "%CENTRAL_ROOT%\frontend\all\vs.code-workspace"
    "%CENTRAL_ROOT%\frontend\angular\vs.code-workspace"
) do (
    if not exist "%%~W" (
        echo No se encontro el workspace: %%~W
        set "MISSING_WORKSPACE=1"
    )
)

if "%MISSING_WORKSPACE%"=="1" (
    echo.
    echo Faltan uno o mas workspaces del proyecto central:
    echo %CENTRAL_ROOT%
    echo Actualice la variable CENTRAL_ROOT en este archivo.
    pause
    exit /b 1
)

where code >nul 2>&1
if errorlevel 1 (
    echo.
    echo No se encontro el comando "code" de Visual Studio Code en el PATH.
    pause
    exit /b 1
)

:main_menu
cls
echo =========================================
echo     Workspaces centralizados de VS Code
echo =========================================
echo Proyecto que se abrira: %TARGET_PROJECT%
echo Configuracion central:  %CENTRAL_ROOT%
echo.
echo  0. Salir
echo  1. Backend
echo  2. Frontend
echo.
set "OPTION="
set /P "OPTION=Seleccione una opcion y presione Enter: "
if "%OPTION%"=="2" goto frontend_menu
if "%OPTION%"=="1" goto backend_menu
if "%OPTION%"=="0" goto end
goto invalid_main_option

:backend_menu
cls
echo =========================================
echo                 Backend
echo =========================================
echo.
echo  0. Volver
echo  1. Java
echo  2. PHP
echo  3. Python
echo.
set "OPTION="
set /P "OPTION=Seleccione una opcion y presione Enter: "
if "%OPTION%"=="3" (
    set "VSCODE_PROFILE=Profile_Back_Python"
    set "WORKSPACE_TEMPLATE=%CENTRAL_ROOT%\backend\python\vs.code-workspace"
    goto open_workspace
)
if "%OPTION%"=="2" (
    set "VSCODE_PROFILE=Profile_Back_PHP"
    set "WORKSPACE_TEMPLATE=%CENTRAL_ROOT%\backend\php\vs.code-workspace"
    goto open_workspace
)
if "%OPTION%"=="1" (
    set "VSCODE_PROFILE=Profile_Back_Java"
    set "WORKSPACE_TEMPLATE=%CENTRAL_ROOT%\backend\java\vs.code-workspace"
    goto open_workspace
)
if "%OPTION%"=="0" goto main_menu
goto invalid_backend_option

:frontend_menu
cls
echo =========================================
echo                 Frontend
echo =========================================
echo.
echo  0. Volver
echo  1. Todo
echo  2. Angular
echo.
set "OPTION="
set /P "OPTION=Seleccione una opcion y presione Enter: "
if "%OPTION%"=="2" (
    set "VSCODE_PROFILE=Profile_Front_Angular"
    set "WORKSPACE_TEMPLATE=%CENTRAL_ROOT%\frontend\angular\vs.code-workspace"
    goto open_workspace
)
if "%OPTION%"=="1" (
    set "VSCODE_PROFILE=Profile_Front_All"
    set "WORKSPACE_TEMPLATE=%CENTRAL_ROOT%\frontend\all\vs.code-workspace"
    goto open_workspace
)
if "%OPTION%"=="0" goto main_menu
goto invalid_frontend_option

:invalid_main_option
echo.
echo Opcion no valida. Escriba 0, 1 o 2 y presione Enter.
pause
goto main_menu

:invalid_backend_option
echo.
echo Opcion no valida. Escriba 0, 1, 2 o 3 y presione Enter.
pause
goto backend_menu

:invalid_frontend_option
echo.
echo Opcion no valida. Escriba 0, 1 o 2 y presione Enter.
pause
goto frontend_menu

:open_workspace
cls
echo =========================================
echo       Proyecto y workspace seleccionados
echo =========================================
echo Proyecto actual:       %TARGET_PROJECT%
echo Workspace central:     %WORKSPACE_TEMPLATE%
echo Perfil de VS Code:     %VSCODE_PROFILE%
echo.

rem Se crea fuera del proyecto destino para no copiar configuraciones en el.
rem Se incluye la carpeta contenedora para que dos clones con el mismo nombre
rem (por ejemplo, en cuentas distintas) no compartan pestañas ni estado.
for %%I in ("%TARGET_PROJECT%") do set "TARGET_PROJECT_NAME=%%~nxI"
for %%I in ("%TARGET_PROJECT%\..") do set "TARGET_PROJECT_CONTAINER=%%~nxI"
set "VSCODE_TEMPLATE_FILE=%WORKSPACE_TEMPLATE%"
set "VSCODE_TARGET_PROJECT=%TARGET_PROJECT%"
set "TEMP_WORKSPACE=%TEMP%\vs-%TARGET_PROJECT_CONTAINER%-%TARGET_PROJECT_NAME%.code-workspace"
set "VSCODE_TEMP_WORKSPACE=%TEMP_WORKSPACE%"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$source = [IO.File]::ReadAllText($env:VSCODE_TEMPLATE_FILE); $project = $env:VSCODE_TARGET_PROJECT.Replace('\', '/'); $quote = [char]34; $needle = $quote + 'path' + $quote + ': ' + $quote + '.' + $quote; $replacement = $quote + 'path' + $quote + ': ' + $quote + $project + $quote; $workspace = $source.Replace($needle, $replacement); [IO.File]::WriteAllText($env:VSCODE_TEMP_WORKSPACE, $workspace, [System.Text.UTF8Encoding]::new($false))"

if errorlevel 1 (
    echo.
    echo No se pudo crear el workspace temporal.
    pause
    goto main_menu
)

echo.
echo Workspace temporal:    %TEMP_WORKSPACE%
echo.
echo Abriendo Visual Studio Code en una nueva ventana. Cierre ese workspace para continuar...
code --new-window --wait --profile "%VSCODE_PROFILE%" "%TEMP_WORKSPACE%"
set "VSCODE_EXIT_CODE=%ERRORLEVEL%"
echo.
if exist "%TEMP_WORKSPACE%" del /q "%TEMP_WORKSPACE%"
if exist "%TEMP_WORKSPACE%" (
    echo No se pudo eliminar el workspace temporal:
    echo %TEMP_WORKSPACE%
) else (
    echo Workspace temporal eliminado correctamente.
)
if not "%VSCODE_EXIT_CODE%"=="0" echo VS Code finalizo con codigo: %VSCODE_EXIT_CODE%
pause
goto end

:end
endlocal
exit /b 0
