INSERT INTO tenants (name, subdomain)
VALUES ('CareSync MedCare', 'caresync')
ON CONFLICT (subdomain) DO NOTHING;
