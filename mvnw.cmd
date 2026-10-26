@REM Maven Wrapper script (Windows)
@echo off
setlocal
set BASEDIR=%~dp0.
if "%JAVA_HOME%"=="" (set JAVA_EXE=java) else (set JAVA_EXE=%JAVA_HOME%\bin\java.exe)
"%JAVA_EXE%" -classpath "%BASEDIR%\.mvn\wrapper\maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%BASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*