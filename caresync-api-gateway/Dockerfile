FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
COPY caresync-common/pom.xml caresync-common/pom.xml
COPY caresync-api-gateway/pom.xml caresync-api-gateway/pom.xml
COPY caresync-patient-service/pom.xml caresync-patient-service/pom.xml
COPY caresync-clinical-service/pom.xml caresync-clinical-service/pom.xml
COPY caresync-billing-service/pom.xml caresync-billing-service/pom.xml
COPY caresync-common/src caresync-common/src
COPY caresync-api-gateway/src caresync-api-gateway/src
RUN mvn -B -pl caresync-api-gateway -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/caresync-api-gateway/target/*.jar app.jar
EXPOSE 10000
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70.0","-XX:+UseSerialGC","-jar","/app/app.jar"]
