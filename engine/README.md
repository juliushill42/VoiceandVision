# Creator Engine (in-repo)

Drop the 2026-09-26 Voice & Vision Creator Engine here.

Source package (Drive):
`LLM Stay Updated / voice-vision-creator-engine-complete-2026-09-26.zip`
SHA-256 `829ac67bb88ccac18adc965ceade47034ea22e464a114553e89c1963a4d5c760`

Patched `app/server.py` in this repo adds CORS and Accept-executes.
If you unpack the zip, keep that patched server file.

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

Listens on `127.0.0.1:8765`. The React studio on `:8080` calls it through `src/lib/engine/client.ts`.
