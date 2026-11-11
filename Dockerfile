FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

COPY backend/pom.xml .
COPY backend/caresync-common/pom.xml caresync-common/pom.xml
COPY backend/caresync-api-gateway/pom.xml caresync-api-gateway/pom.xml
COPY backend/caresync-patient-service/pom.xml caresync-patient-service/pom.xml
COPY backend/caresync-clinical-service/pom.xml caresync-clinical-service/pom.xml
COPY backend/caresync-billing-service/pom.xml caresync-billing-service/pom.xml
COPY backend/caresync-payroll-service/pom.xml caresync-payroll-service/pom.xml
COPY backend/caresync-laboratory-service/pom.xml caresync-laboratory-service/pom.xml

COPY backend/caresync-common/src caresync-common/src
COPY backend/caresync-api-gateway/src caresync-api-gateway/src
RUN mvn -B -ntp -pl caresync-api-gateway -am package -Dmaven.test.skip=true

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/caresync-api-gateway/target/*.jar app.jar
EXPOSE 10000
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70.0","-XX:+UseSerialGC","-jar","/app/app.jar"]
