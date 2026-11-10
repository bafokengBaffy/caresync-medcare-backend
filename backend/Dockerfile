FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /workspace

ARG SERVICE_NAME=caresync-api-gateway

COPY pom.xml .
COPY caresync-api-gateway/pom.xml caresync-api-gateway/pom.xml
COPY caresync-billing-service/pom.xml caresync-billing-service/pom.xml
COPY caresync-clinical-service/pom.xml caresync-clinical-service/pom.xml
COPY caresync-common/pom.xml caresync-common/pom.xml
COPY caresync-patient-service/pom.xml caresync-patient-service/pom.xml
COPY caresync-payroll-service/pom.xml caresync-payroll-service/pom.xml
COPY caresync-laboratory-service/pom.xml caresync-laboratory-service/pom.xml

RUN case "$SERVICE_NAME" in \
      caresync-api-gateway|caresync-patient-service|caresync-billing-service|caresync-clinical-service|caresync-payroll-service|caresync-laboratory-service) ;; \
      *) echo "Unsupported SERVICE_NAME: $SERVICE_NAME" >&2; exit 1 ;; \
    esac \
    && mvn -B -ntp -pl "$SERVICE_NAME" -am dependency:go-offline

COPY caresync-api-gateway caresync-api-gateway
COPY caresync-billing-service caresync-billing-service
COPY caresync-clinical-service caresync-clinical-service
COPY caresync-common caresync-common
COPY caresync-patient-service caresync-patient-service
COPY caresync-payroll-service caresync-payroll-service
COPY caresync-laboratory-service caresync-laboratory-service

RUN mvn -B -ntp -Dmaven.test.skip=true -pl "$SERVICE_NAME" -am package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

ARG SERVICE_NAME=caresync-api-gateway
COPY --from=build /workspace/${SERVICE_NAME}/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
