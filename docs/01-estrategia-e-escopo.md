# 1. Estratégia do produto e escopo do MVP

## 1.1 Visão

**Camino 3D** é o copiloto digital do peregrino: um único aplicativo que acompanha a pessoa do planejamento em casa até a chegada à Praça do Obradoiro, reunindo rota, navegação, hospedagem, comida, clima, cultura, tradução, segurança e comunidade. O personagem 3D personalizável é a camada emocional que transforma a jornada em uma história própria, sem nunca atrapalhar as informações críticas.

**Posicionamento:** "Tudo o que você precisa para o Caminho, num só lugar, mesmo sem sinal."

## 1.2 Problema

Hoje o peregrino combina cinco ou mais aplicativos (guia de etapas, Booking/Google Maps, previsão do tempo, tradutor, grupos de WhatsApp/Facebook) e guias em PDF desatualizados. As dores mais citadas em fóruns e guias:

1. Não saber quanto andar por dia e onde dormir no fim da etapa.
2. Albergues lotados na alta temporada e informação de preço sem data.
3. Falta de sinal em trechos rurais (mapas que não funcionam offline).
4. Barreira de idioma em farmácia, restaurante e emergência.
5. Solidão ou, no outro extremo, falta de controle sobre quem vê a sua posição.
6. Pouca informação de acessibilidade (inclinação, piso, escadas).

## 1.3 Hipóteses de negócio (não são métricas comprovadas)

| Hipótese | Valor informado | Observação |
|---|---|---|
| Peregrinos/ano | ~540 mil | A Oficina del Peregrino registrou cerca de 499 mil compostelas em 2024; 540 mil é plausível como projeção, mas deve ser validado. |
| Média mensal | ~45 mil | **Forte sazonalidade**: maio a outubro concentram a maior parte do fluxo. A média mensal esconde meses de inverno muito fracos. |
| Conversão | 2,5% a 3% | Benchmark otimista para app pago; validar com teste. |
| Assinantes | ~1.000 a 1.500/mês | 13,5 mil a 16,2 mil/ano se a conversão se confirmar. |
| Preço | EUR 10 | Ver discussão abaixo sobre "assinatura" versus "passe por Caminho". |

**Receita bruta hipotética:** 1.125 a 1.350 assinantes/mês × EUR 10 ≈ EUR 11 mil a 13,5 mil/mês **antes** de taxas (Stripe na web ~1,5% + EUR 0,25; lojas Apple/Google 15% a 30% para compras digitais dentro do app), impostos (IVA europeu) e custos de API.

### Recomendação de PM sobre o preço

Uma jornada típica dura de 1 a 5 semanas. Uma assinatura mensal recorrente tende a gerar cancelamento logo após a chegada a Santiago (churn estrutural). Sugiro testar em paralelo:

- **Passe do Caminho (EUR 10, válido por 45 dias, sem renovação automática)**, alinhado à realidade de uso.
- **Premium mensal (EUR 10/mês)**, para quem planeja meses antes ou faz vários caminhos.
- **Plano gratuito**, como funil de aquisição.

O MVP já modela os dois produtos pagos (`Subscription.kind = 'pass' | 'monthly'`) para permitir esse teste A/B.

## 1.4 Fontes de receita

1. Assinatura Premium / Passe do Caminho (principal no MVP).
2. Destaques patrocinados de hospedagens, restaurantes, cafés e lojas, **sempre identificados como "Patrocinado"** e **nunca** alterando alertas, recomendações de segurança ou o ranking do modo "Mais segura".
3. Comissões de reservas via programas de afiliados oficiais (fase 2).
4. Experiências culturais, transporte de mochila, seguros, apenas com parceiros autorizados (fase 3).
5. Planos para estabelecimentos e parcerias com municípios e associações (fase 3).
6. Expansão para outros caminhos (Francês, Primitivo, Norte, Via Francigena) e trilhas europeias.

## 1.5 Métricas (estrutura AARRR)

| Etapa | Evento instrumentado | Métrica |
|---|---|---|
| Aquisição | `signup_started` | Visitantes → cadastro iniciado |
| Ativação | `signup_completed`, `onboarding_completed`, `route_created` | % que cria a primeira rota em 24h |
| Engajamento | `navigation_started`, `accommodation_viewed`, `translation_used`, `location_sharing_enabled`, `pilgrim_connected` | Funcionalidades usadas por sessão |
| Receita | `booking_click`, `premium_trial_started`, `subscription_completed` | Conversão free → pago, receita por usuário |
| Retenção | `subscription_cancelled`, `retention_d7`, `retention_d30` | Retenção D7/D30, churn |

Todos os eventos só são enviados com consentimento de analytics (GDPR). O painel administrativo mostra o funil com **dados de demonstração** identificados.

## 1.6 Escopo do MVP (esta versão)

**Incluído e executável:**

- PWA mobile-first instalável, com modo claro, escuro e alto contraste.
- Cadastro por e-mail (modo demonstração local), botões visuais de login social desativados até haver credenciais.
- Onboarding completo com consentimentos.
- Planejador: Caminho Português com **3 rotas reais em traçado simplificado** (Central, da Costa e Variante Espiritual), divisão automática em etapas conforme dias e distância diária, 8 modos de rota.
- Mapa 2D (MapLibre + OpenStreetMap/OpenFreeMap) com fallback esquemático offline, modo exploração 3D, simulação de navegação, alerta de saída da rota.
- Hospedagens, restaurantes, eventos, clima, tudo com selo **"Dados de demonstração"**, fonte e data de atualização.
- Tradutor por voz (Web Speech API do navegador, com consentimento) e frases essenciais offline.
- Comunidade com presença desligada por padrão, granularidade de localização e expiração automática.
- Personagem 3D personalizável (React Three Fiber) com fallback 2D sem WebGL.
- Diário, carimbos simbólicos e conquistas.
- Central de Segurança com SOS com confirmação e 112.
- Planos e assinatura (Stripe quando houver chave, simulação identificada sem chave).
- Painel administrativo básico: parceiros, patrocínios, moderação, funil.
- Camada de provedores substituíveis, cache, rate limiting e fallback.

**Fica para versões futuras:**

| Versão | Itens |
|---|---|
| v0.2 (Beta fechado) | Supabase real (auth, Postgres/PostGIS, realtime do chat), Open-Meteo real, roteamento OpenRouteService/GraphHopper, traçados GPX oficiais do Caminho Português |
| v0.3 | Tiles vetoriais offline (PMTiles), navegação por voz, notificações push, moderação com fila real |
| v1.0 (lojas) | Empacotamento Capacitor para iOS/Android, compras dentro do app, Sentry, analytics com consentimento em produção |
| v1.x | Afiliados de hospedagem, Google Places oficial, eventos licenciados, tradução por servidor (DeepL/Google), outros caminhos |

## 1.7 Princípios de produto

1. **Segurança antes de tudo:** nunca afirmar que uma rota é "segura" de forma absoluta; sempre mostrar alertas e a idade dos dados.
2. **Honestidade de dados:** nada inventado como se fosse ao vivo. Selo "Dados de demonstração", fonte e horário em todo dado externo.
3. **Privacidade por padrão:** localização desligada, granularidade escolhida pelo usuário, expiração automática, sem histórico.
4. **Funciona sem sinal:** o essencial (rota, frases, segurança) está disponível offline.
5. **3D como recompensa, não como obstáculo:** o mapa 2D é sempre o caminho principal de navegação.
