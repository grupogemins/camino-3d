# 06. Design system

Identidade: pedra, verde do caminho, azul atlântico, terracota dos telhados e dourado da vieira. Ilustrações e personagem são originais; nenhum logotipo de terceiros.

## Tokens (`src/app/globals.css`)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#f5f1e8` | `#121614` | fundo (textura de pontos sutil) |
| `--surface` | `#ffffff` | `#1c2320` | cartões |
| `--ink` / `--ink-muted` | `#1c2420` / `#545d57` | `#eef1ea` / `#aab4ac` | texto |
| `--primary` | `#2f5d3a` | `#86c493` | ações principais, rota |
| `--blue` | `#1f4e79` | `#8fbbe6` | informação, posição |
| `--terracotta` | `#a8492a` | `#ee9b78` | carimbos, peregrinos |
| `--gold` | `#d4a017` | `#e6bb45` | conquistas, Premium |
| `--danger` | `#b3261e` | `#ff8a80` | SOS, exclusão |
| `--warning-*` | `#7a4f00` sobre `#fff1cc` | `#ffd36b` sobre `#352a10` | avisos, selo Demo |

Tema "Alto contraste": fundo preto, texto branco, ação amarela `#ffe14d`, bordas brancas. Temas trocam via `data-theme` no `<html>` (Sistema, Claro, Escuro, Alto contraste) em Perfil.

## Tipografia e escala

- Atkinson Hyperlegible (feita para baixa visão; zero cortado evita confusão com "O").
- Base 17 px; escala de texto do usuário 1 / 1,15 / 1,3.
- Títulos 800, corpo 400, rótulos 600.

## Espaço, forma e toque

- Grade de 4 px; cartões com raio 24 px, botões 16 px, chips pílula.
- Alvo de toque mínimo 44–48 px; navegação inferior no celular e lateral a partir de `md`.
- Foco visível com anel de 3 px (`--focus`). Link "Pular para o conteúdo".

## Componentes (`src/components/ui`)

Button/ButtonLink (primary, secondary, outline, ghost, danger), Card, SectionTitle, Stat, Badge, DemoBadge/SponsoredBadge/SourceLine, Field, SelectField, Switch (`role=switch`), ChipGroup (`aria-pressed`), Segmented (rádio), RangeField, Dialog (nativo), ProgressBar, e os estados Loading, Empty, Error, Offline e Notice.

Regras de rótulo:
- Todo dado simulado mostra "Demo" e a linha de fonte com data.
- Item patrocinado sempre mostra "Patrocinado" e nunca aparece em recomendações de segurança.

## Acessibilidade (WCAG 2.2 AA)

- Contraste ≥ 4,5:1 nos três temas.
- Nenhuma informação só por cor (dificuldade tem texto e ícone).
- Gráficos com alternativa em tabela (admin e perfil de elevação).
- `prefers-reduced-motion` respeitado mais uma opção manual que pausa o 3D.
- 3D sempre tem alternativa 2D (sem WebGL, ou `?webgl=off`).
