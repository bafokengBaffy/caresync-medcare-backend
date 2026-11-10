# Render CloudAMQP Environment Setup

The Render manifests define a shared `caresync-cloudamqp` environment group for
the Clinical and Billing services. When Render prompts for the group values,
use:

| Key | Value |
| --- | --- |
| `SPRING_RABBITMQ_ADDRESSES` | `amqps://psczzhvm:<YOUR_CLOUDAMQP_PASSWORD>@toucan.lmq.cloudamqp.com/psczzhvm` |
| `SPRING_RABBITMQ_SSL_ENABLED` | `true` |

Replace `<YOUR_CLOUDAMQP_PASSWORD>` with the CloudAMQP password and paste the
complete URL directly into the Render secret field. Never commit the real
password to source control or share it in chat. Existing variables on another
Render service are not automatically copied into this group.

Both services read these settings through Spring Boot's `spring.rabbitmq`
properties. TLS is enabled explicitly in the service configuration and by the
`SPRING_RABBITMQ_SSL_ENABLED=true` Render variable.

The other groups referenced by the manifests (`caresync-firebase`,
`caresync-database`, and `caresync-storage`) also require their secret values
in Render before the corresponding services can start.

## Frontend production build

The frontend requires this public gateway URL at build time:

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://caresync-api-gateway.onrender.com` |

Set it in the frontend hosting build environment. For Firebase Hosting, make it
available to `npm --prefix frontend run build` before running `firebase deploy`.
The Vercel rewrite in `frontend/vercel.json` also targets this gateway.

The backend Dockerfiles currently skip test-source compilation when packaging
images because the Patient Service test sources reference missing classes.
Run and repair the full test suite separately before treating it as passing;
image builds do not imply tests passed.
