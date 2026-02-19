@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Begin all REM://
@echo off

@REM Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@REM Find the project base dir
set MAVEN_PROJECTBASEDIR=%~dp0
@REM Remove trailing backslash
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

@REM Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute
echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto error

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto error

:execute
@REM Check if Maven is already available
set MAVEN_CMD=mvn
where %MAVEN_CMD% >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto runMaven

@REM Setup Maven Wrapper
set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

@REM Download Maven if wrapper jar doesn't exist
if exist %WRAPPER_JAR% goto runWrapper

@REM Read distributionUrl from maven-wrapper.properties
for /f "usebackq tokens=1,2 delims==" %%a in (%WRAPPER_PROPERTIES%) do (
    if "%%a"=="distributionUrl" set DOWNLOAD_URL=%%b
)

@REM Create a temp directory for Maven
set MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.6
if exist "%MAVEN_HOME%\bin\mvn.cmd" goto runDownloadedMaven

echo Downloading Maven from %DOWNLOAD_URL%...
mkdir "%MAVEN_HOME%" 2>NUL

@REM Use PowerShell to download
powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%TEMP%\maven.zip' }"

@REM Extract
powershell -Command "& { Expand-Archive -Path '%TEMP%\maven.zip' -DestinationPath '%MAVEN_HOME%' -Force }"

@REM Move contents up one level if needed
if exist "%MAVEN_HOME%\apache-maven-3.9.6\bin\mvn.cmd" (
    xcopy /E /Y /Q "%MAVEN_HOME%\apache-maven-3.9.6\*" "%MAVEN_HOME%\" >NUL
    rmdir /S /Q "%MAVEN_HOME%\apache-maven-3.9.6" 2>NUL
)

del "%TEMP%\maven.zip" 2>NUL

:runDownloadedMaven
set MAVEN_CMD=%MAVEN_HOME%\bin\mvn.cmd
goto runMaven

:runWrapper
"%JAVA_EXE%" %MAVEN_OPTS% -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %*
goto end

:runMaven
"%MAVEN_CMD%" %*
if "%ERRORLEVEL%" == "0" goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%

cmd /C exit /B %ERROR_CODE%
