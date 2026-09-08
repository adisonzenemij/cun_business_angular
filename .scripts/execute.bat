@echo off
setlocal

set "SCRIPT_PATH=D:\Engineering\Software\spacing\github\adisonzenemij\d88676c1fd0a\.scripts\script.bat"
set "SCRIPT_PROJECT_ROOT=%CD%"

if not exist "%SCRIPT_PATH%" (
    echo.
    echo ERROR: No se encontro el archivo:
    echo %SCRIPT_PATH%
    echo.
    pause
    exit /b 1
)

for %%I in ("%SCRIPT_PATH%") do (
    set "SCRIPT_DIR=%%~dpI"
)

pushd "%SCRIPT_DIR%"

call "%SCRIPT_PATH%"
set "RESULT=%ERRORLEVEL%"

popd

echo.
if not "%RESULT%"=="0" (
    echo El proceso finalizo con el codigo de error: %RESULT%
) else (
    echo El proceso finalizo correctamente.
)

echo.
pause

exit /b %RESULT%
