# Configuration & Externalized Settings Inventory

The project has frontend Vite settings, Spring Boot service configuration, and Render deployment descriptors. The repository contains no assessment report documents at this time, so this inventory is based on checked-in source configuration; provider-specific production credentials and infrastructure limits remain to be supplied.

## Configuration Sources

| Source | Type | Path/Location | Notes |
|---|---|---|---|
| Frontend environment template | Vite env | `frontend/.env.example` | VITE-prefixed values are compiled into the browser bundle and are public. |
| Frontend build configuration | Vite | `frontend/vite.config.ts` | Development server uses `VITE_GATEWAY_URL` as the `/api` proxy target. |
| Backend environment template | Spring Boot env reference | `backend/.env.example` | Reference only; Spring Boot does not load `.env` files by default. |
| Gateway configuration | Spring Boot YAML | `backend/caresync-api-gateway/src/main/resources/application.yml` | Default port 8080; Firebase and browser origins are externalized. |
| Gateway local profile | Spring Boot profile YAML | `backend/caresync-api-gateway/src/main/resources/application-local.yml` | Selects `local`; no extra property overrides. |
| Gateway production profile | Spring Boot profile YAML | `backend/caresync-api-gateway/src/main/resources/application-prod.yml` | Selects `prod`; no extra property overrides. |
| Patient configuration | Spring Boot YAML | `backend/caresync-patient-service/src/main/resources/application.yml` | PostgreSQL credentials and Firebase flag are externalized. |
| Patient local/production/test profiles | Spring Boot profile YAML | `backend/caresync-patient-service/src/main/resources/application-{local,prod,test}.yml` | Local/prod use external DB values; test uses in-memory H2. |
| Clinical configuration | Spring Boot YAML | `backend/caresync-clinical-service/src/main/resources/application.yml` | PostgreSQL, Firebase and Firestore settings are externalized. |
| Billing configuration | Spring Boot YAML | `backend/caresync-billing-service/src/main/resources/application.yml` | PostgreSQL and Firebase settings are externalized. |
| Shared Spring settings | Spring Boot YAML | `backend/caresync-common/src/main/resources/application-common.yml` | Shared Jackson, MVC, and actuator settings; no env placeholders found. |
| Render deployment descriptors | Render YAML | `backend/caresync-{api-gateway,patient-service,clinical-service}/render.yaml` | Gateway sets `SPRING_PROFILES_ACTIVE=prod`; gateway, patient, and clinical define `/actuator/health` checks. Billing has no descriptor. |
| Maven wrapper | Build configuration | `backend/.mvn/wrapper/maven-wrapper.properties` | Maven Wrapper distribution version 3.9.6. |
| External credentials | Google Application Default Credentials | `GOOGLE_APPLICATION_CREDENTIALS` or host-provided identity | Firebase Admin and Firestore use Google ADC; no credential values are stored in the repository. |

## Build Profiles

| Profile | Activation | Purpose | Key Dependencies/Plugins |
|---|---|---|---|
| Maven default | Default Maven build | Builds the Java 21 multi-module Spring application. No custom Maven profiles were found. | Spring Boot parent 3.2.5; Java 21 compiler; Maven Wrapper 3.9.6. |
| Vite development | `npm run dev` | Runs the frontend development server and `/api` proxy. | Vite 5.2.6 and React plugin 4.2.1. |
| Vite production build | `npm run build` | Type-checks/builds the deployable frontend bundle. | `tsc -b` followed by Vite build. |
| Vite preview | `npm run preview` | Serves the built frontend for local preview. | Vite preview server. |

## Runtime Profiles

| Profile | Activation Method | Config Files | Key Overrides |
|---|---|---|---|
| local | `SPRING_PROFILES_ACTIVE=local` | Gateway and patient `application-local.yml`; other services use base configuration | Local profile YAMLs provide profile activation; DB connection still comes from `SUPABASE_DB_*`. |
| prod | `SPRING_PROFILES_ACTIVE=prod` | Gateway and patient `application-prod.yml`; Render sets `prod` for gateway | Patient port uses platform `PORT` (default 8081); gateway has default 8080. |
| test | Spring test profile | Patient `application-test.yml` and test resources | Uses in-memory H2 for patient tests. |
| frontend development | Vite development mode | `frontend/.env.local` or `.env.development.local` (copy values from `frontend/.env.example`) | API defaults to localhost:8080; dev proxy target can be changed with `VITE_GATEWAY_URL`. |
| frontend production | Vite production build | Hosting-provider build environment | Supply production API origin and public Firebase web-app settings before building; Vercel's checked-in rewrite currently points to the Render gateway. |

## Properties Inventory

### Frontend

| Property Key | Default | Profiles | Source |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` in the API client | All; set separately for production build | Frontend env; API client |
| `VITE_GATEWAY_URL` | `http://localhost:8080` | Development only | Frontend env; Vite `/api` proxy |
| `VITE_FIREBASE_API_KEY` | `REPLACE_ME` in the example; Firebase initialization remains disabled with this value | All | Frontend env; Firebase web config; public client value, not a server credential |
| `VITE_FIREBASE_AUTH_DOMAIN` | No application default | All | Frontend env; Firebase web config |
| `VITE_FIREBASE_PROJECT_ID` | No application default | All | Frontend env; Firebase web config |
| `VITE_FIREBASE_STORAGE_BUCKET` | No application default | All | Frontend env; Firebase web config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No application default | All | Frontend env; Firebase web config |
| `VITE_FIREBASE_APP_ID` | No application default | All | Frontend env; Firebase web config |

### Backend services

| Property Key | Default | Profiles | Source |
|---|---|---|---|
| `PORT` | Gateway 8080; patient 8081; clinical 8082; billing 8083 | All; hosting platform may inject a port | Spring `server.port` in each service configuration |
| `SPRING_PROFILES_ACTIVE` | No common default found | Render sets `prod` for gateway; use `local` for local runs | Process environment / Render descriptor |
| `SUPABASE_DB_URL` | Required; no default | Patient local/base, clinical, billing | Spring datasource URL; JDBC PostgreSQL URL |
| `SUPABASE_DB_USER` | Required; no default | Patient local/base, clinical, billing | Spring datasource username |
| `SUPABASE_DB_PASSWORD` | Required; no default | Patient local/base, clinical, billing | Spring datasource password; secret |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Gateway | Gateway CORS configuration |
| `FIREBASE_ENABLED` | `false` | Gateway, patient, clinical, billing | Conditional Firebase Admin configuration |
| `FIREBASE_PROJECT_ID` | Optional; no default | Gateway when Firebase is enabled | Gateway Firebase configuration; ADC supplies credentials |
| `FIRESTORE_ENABLED` | `false` | Clinical service | Conditional Firestore configuration; requires Google ADC when enabled |
| `GOOGLE_APPLICATION_CREDENTIALS` | Not set; Google ADC uses the host's default identity | Local/production when using a service-account file | Google authentication library convention; use a protected file path, never commit the credential |

The shared `application-common.yml` contains no environment placeholders. No additional environment-variable references were found in the service source configuration.

### Environment template files

- Local/development backend: copy `backend/.env.example` and export its values or enter them in the IDE run configuration. The backend doesn't automatically load `.env`.
- Production backend: use `backend/.env.production.example` as the key/value checklist when setting each service's environment in the hosting provider. Let the provider inject `PORT`; set database and Google credentials only in its protected settings.
- Local/development frontend: copy `frontend/.env.example` to `frontend/.env.local`.
- Production frontend: use `frontend/.env.production.example` as the frontend hosting build variables. Replace the example Firebase values with the project's web-app configuration. These values are visible in the built client.

Production backend template:

```dotenv
SPRING_PROFILES_ACTIVE=prod
SUPABASE_DB_URL=jdbc:postgresql://your-db-host:5432/your-database?sslmode=require
SUPABASE_DB_USER=replace-with-production-database-user
SUPABASE_DB_PASSWORD=replace-with-production-database-password
ALLOWED_ORIGINS=https://your-production-frontend.example
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=your-production-firebase-project-id
FIRESTORE_ENABLED=false
```

Production frontend template:

```dotenv
VITE_API_BASE_URL=https://caresync-api-gateway.onrender.com
VITE_FIREBASE_API_KEY=REPLACE_WITH_PUBLIC_FIREBASE_WEB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=REPLACE_WITH_FIREBASE_WEB_APP_ID
```

## Startup Parameters & Resource Requirements

| Service | JVM/Runtime Options | Memory | Instance Count |
|---|---|---|---|
| API gateway | No JVM flags specified; `PORT` defaults to 8080 | Not specified | Not specified |
| Patient service | `-XX:+UseSerialGC -Xmx512m`; `PORT` defaults to 8081 | Container limit not specified | Not specified |
| Clinical service | No JVM flags specified; `PORT` defaults to 8082 | Not specified | Not specified |
| Billing service | No JVM flags specified; `PORT` defaults to 8083 | Not specified | Not specified |
| Frontend | Vite development server uses port 5173; production image serves with Nginx on port 80 | Not specified | Not specified |

## Startup Dependency Chain

1. PostgreSQL/Supabase must be reachable before the patient, clinical, and billing services can complete datasource initialization.
2. Firebase Admin or Firestore credentials must be available before starting services with the corresponding feature enabled.
3. The gateway has no declared service-start ordering or explicit wait-for mechanism in the repository.

Render health checks are configured for the gateway, patient, and clinical services at `/actuator/health`. No resource limits, startup timeouts, or dependency health gates were found. The billing service has no Render descriptor in the repository.

## Secrets & Sensitive Configuration

| Secret Reference | Type | Storage (masked) |
|---|---|---|
| `SUPABASE_DB_PASSWORD` | Database password | Local shell/ignored `.env`; production hosting secret store; never commit |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase/Google service-account credential file | Keep file outside source control; in cloud, use provider identity or securely mounted secret file |
| `VITE_FIREBASE_API_KEY` | Public Firebase web-app configuration | Frontend build environment; restrict its use with Firebase project settings; it is not a server secret |

### Secrets Provisioning Workflow

For local work, copy the backend and frontend examples, replace local database values, and supply the backend values through the shell or IDE run configuration; Spring Boot does not read `.env` files automatically. Keep any service-account JSON outside the repository. For production, set database credentials, origins, profile, and feature toggles in the hosting provider's environment/secret settings; provide Firebase credentials through a supported workload identity or a securely mounted service-account file. Set `VITE_*` Firebase web configuration and the API origin in the frontend hosting provider before its production build. The repository does not specify a production identity/RBAC model, credential rotation policy, or secret-binding automation.

## Feature Flags

| Flag Name | Default | Controlled By |
|---|---|---|
| Firebase Admin integration | `false` | `FIREBASE_ENABLED` |
| Firestore clinical-note storage | `false` | `FIRESTORE_ENABLED` (clinical service only) |
| Frontend Firebase initialization | Disabled when API key is missing or `REPLACE_ME` | `VITE_FIREBASE_API_KEY` |

## Framework & Runtime Versions

| Component | Version | Source |
|---|---|---|
| Java | 21 | `backend/pom.xml` |
| Spring Boot | 3.2.5 | `backend/pom.xml` |
| Spring Cloud | 2023.0.1 | `backend/pom.xml` |
| Firebase Admin SDK | 9.2.0 | `backend/pom.xml` |
| Maven | 3.9.6 wrapper distribution | `backend/.mvn/wrapper/maven-wrapper.properties` |
| Node.js | 20 (frontend Docker build image) | `frontend/Dockerfile`; no package `engines` declaration |
| Patient service container runtime | Eclipse Temurin 21 JRE Alpine | `backend/caresync-patient-service/Dockerfile` |
| Frontend container runtime | Nginx 1.27 Alpine | `frontend/Dockerfile` |
| React | 18.2.0 | `frontend/package.json` |
| Vite | 5.2.6 | `frontend/package.json` |
| TypeScript | 5.4.3 | `frontend/package.json` |
| Other backend container base images | Not identified | No other backend Dockerfiles were found in the workspace |

> Note: Some configuration sources or properties could not be fully identified because no assessment reports or complete production infrastructure configuration are present in the workspace.
