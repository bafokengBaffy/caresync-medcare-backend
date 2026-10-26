#!/bin/sh
# Maven Wrapper script (Unix/macOS) — simplified
BASEDIR=$(cd "$(dirname "$0")" && pwd)
JAVA_EXE="java"
if [ -n "$JAVA_HOME" ]; then JAVA_EXE="$JAVA_HOME/bin/java"; fi
exec "$JAVA_EXE" -classpath "$BASEDIR/.mvn/wrapper/maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=$BASEDIR" org.apache.maven.wrapper.MavenWrapperMain "$@"