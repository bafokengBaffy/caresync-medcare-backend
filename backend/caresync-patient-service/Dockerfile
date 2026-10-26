FROM maven:3.9.16-eclipse-temurin-25 AS build
WORKDIR /workspace
COPY pom.xml .
COPY caresync-common/pom.xml caresync-common/pom.xml
COPY caresync-api-gateway/pom.xml caresync-api-gateway/pom.xml
COPY caresync-patient-service/pom.xml caresync-patient-service/pom.xml
COPY caresync-clinical-service/pom.xml caresync-clinical-service/pom.xml
COPY caresync-billing-service/pom.xml caresync-billing-service/pom.xml
COPY caresync-common/src caresync-common/src
COPY caresync-patient-service/src caresync-patient-service/src
RUN mvn -B -pl caresync-patient-service -am package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /workspace/caresync-patient-service/target/*.jar app.jar
EXPOSE 10000
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70.0","-XX:+UseSerialGC","-jar","/app/app.jar"]