COMPANY HUB — ASSESSMENT BUILD COMPATIBILITY FIX

Apply OVER the previous HR Candidate Assessment Camera patch. Replace the three included files, commit and rerun the deployment / npm run check. The prebuild step runs the updated installer automatically. No package or dependency changes are needed.

The reported failure was the installer requiring exactly return secure(await handler.fetch(request, env, ctx));. The updated installer parses the Worker default export with the existing TypeScript dependency, preserves the original fetch response path, and applies assessment headers afterward. Existing QR bypasses and scheduled jobs are preserved. It also supports already integrated versions and different scheduled environment parameter names.

The lint warnings shown in the log did not cause that failure. This fix does not disable lint rules or remove security checks. It stops before writing changes if it cannot safely identify the integration points.

No additional database migration is introduced by this fix. Keep and apply 0041 from the original assessment patch as part of the normal deployment workflow.

Validation: production build and 13 tests passed, including three response-handler formats, repeat installation, check-only mode, preservation of existing QR/cron logic, atomic failure and candidate-only camera headers. Focused lint has no errors; the generated wrapper may report an anonymous-default-export warning, which does not fail the check.
