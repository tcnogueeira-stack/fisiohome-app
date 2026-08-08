# AGENTS.md

## Sincronização de branches (IMPORTANTE)

- `principal` é o branch de deploy (versão publicada/live).
- `main` deve SEMPRE espelhar o `principal`.
- `origin/main` pode conter commits de housekeeping (ex.: remoção de `.vscode`) que não existem no `principal`; nesse caso use MERGE (nunca sobrescrever).
- Ao finalizar qualquer alteração / push:
  1. Garanta que `principal` contém o que será publicado.
  2. Garanta que `origin/main` esteja em sincronia com `origin/principal` (merge com `--no-ff` se houver divergência, nunca `push --force`).
  3. Verifique o estado com `git fetch origin` e compare os logs antes de confirmar.

## Remoção da integração Hotmart

A integração Hotmart foi removida (commit a9ca1ad). Não recriar a coluna `created_from`, o webhook `supabase/functions/hotmart-webhook` nem o trigger relacionado.