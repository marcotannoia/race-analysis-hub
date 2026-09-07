# Security

## Supported version

Only the public API `/api/v1` is supported, currently at version
application `1.14.0`. Endpoints are anonymous, read-only, and subject to
validation, caching, and throttling. The cache retains only
`2xx` responses; health checks and errors use `no-store`. Concurrent requests
for the same URL are merged to avoid duplicate queries on the database.
The request without a language parameter and the request with `?lingua=it` share the
same item; the parameters not provided remain separate and are always
validated. Clients can revalidate their cache with `ETag` and
`If-None-Match`, receiving `304` when the content has not changed.

The API doesn't use secrets because the data is public. CORS doesn't constitute
access control: protection against abuse remains entrusted to rate limits,
validation, shared cache and monitoring. When the static IP of the
backend, a dedicated limit can be added without reducing the
protection applied to public traffic.

## Reporting responsible

To report a vulnerability, write privately to
`marco.tannoia@gmail.com` indicating:

- endpoint or component affected;
- minimum steps to reproduce the problem;
- observed impact;
- any proposal for correction.

Do not put credentials, MongoDB strings, or other secrets in public issues.
Do not perform destructive testing or high traffic volumes on the service in
production.
