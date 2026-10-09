# 1. Estratégia do produto e escopo do MVP

## 1.1 Visão

**Camino 3D é uma peregrinação digital viva: o caminho, o personagem e a comunidade evoluem junto com o peregrino.**

O mapa continua existindo, mas é a infraestrutura invisível. O que a pessoa percebe é uma experiência completa, apoiada em três pilares:

1. **Copiloto que ajuda a decidir:** cruza etapa, ritmo, clima, orçamento, lotação e relatos recentes, e sugere o que fazer ("saia às 7h30 ou termine 6 km antes").
2. **Mundo 3D da própria jornada:** o peregrino personalizado avança conforme as etapas reais, com região, hora local, clima, chegada a cada cidade e lembranças. Isso gera imagens e vídeos compartilháveis.
3. **Camino Live:** a experiência coletiva por etapa (quantos estão ali, idiomas, quem quer caminhar junto, condições do trecho), sem expor posições.

Distribuição por criadores de conteúdo e parceiros locais completa o modelo: utilidade real + experiência 3D compartilhável + rede de peregrinos + criadores.

**Posicionamento:** "Não é mais um mapa do Caminho. É a sua peregrinação, viva, do planejamento às memórias."

**Primeira rota de lançamento: Caminho Francês** (maior fluxo e densidade de dados). A demonstração usa o Caminho Português; o modelo de dados é o mesmo, e Português, Primitivo e Norte entram em seguida.

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
| Preço | EUR 10 (proposta inicial) | Revisado para Camino Pass de EUR 14,99 com cupom de EUR 9,99 (ver abaixo). |

**Receita bruta hipotética:** 1.125 a 1.350 assinantes/mês × EUR 10 ≈ EUR 11 mil a 13,5 mil/mês **antes** de taxas (Stripe na web ~1,5% + EUR 0,25; lojas Apple/Google 15% a 30% para compras digitais dentro do app), impostos (IVA europeu) e custos de API.

### Decisão de preço: Camino Pass (pagamento único)

Uma jornada dura de 1 a 5 semanas; assinatura mensal gera cancelamento logo após Santiago. Por isso o produto é um **passe por jornada, sem assinatura**:

| Produto | Preço no MVP | O que libera |
|---|---|---|
| Gratuito | EUR 0 | Explorar rotas, criar o avatar, planejar a viagem, 1 sugestão do copiloto por dia, cartões de etapa com marca d'água |
| **Camino Pass** | **EUR 14,99** (EUR 9,99 com cupom de lançamento ou de criador) | Jornada liberada para sempre: copiloto completo, offline, Camino Live, retrospectiva, cartões sem marca d'água |
| Grupo/Família | EUR 34,99 (EUR 29,99 com cupom) | O mesmo para até 4 pessoas, com convites |
| Outras rotas | novo passe por rota | Francês, Português, Primitivo, Norte… |

- O preço cheio fica acima de EUR 10 porque EUR 10 deixa pouca margem depois de IVA, tarifa, comissão de afiliado (20–25%) e APIs. O painel admin (aba **Economia**) mostra a conta por cenário.
- Recursos com custo por uso (tradução automática) têm **uso justo** (300 traduções por jornada).
- Reembolso em até 14 dias (direito europeu de desistência).
- Meta de conversão: 10% é meta futura sobre visitas qualificadas, não premissa sobre todo o mercado. O funil é medido por etapa: alcance × visitas qualificadas × início da compra × pagamento aprovado.

## 1.4 Fontes de receita

1. **Camino Pass** e pacote Grupo/Família (principal).
2. **Criadores e afiliados:** link `?ref=CODIGO` e cupom próprio, comissão por venda confirmada, painel de cliques/vendas, e **rotas de criadores** ("O Caminho de [criador]", só com autorização de uso do nome).
3. **Parceiros fundadores** (hospedagens, cafés, restaurantes): cadastro verificado, oferta exclusiva com cupom rastreável, selo, painel de desempenho, cobrança por mês, temporada, clique ou resultado. As ofertas ficam numa seção **separada e marcada como publicidade**; a lista orgânica e o copiloto nunca mudam por pagamento.
4. Comissões de reservas via programas de afiliados oficiais (fase 2).
5. Novas rotas e peregrinações (passes adicionais).

## 1.5 Métricas (estrutura AARRR)

| Etapa | Evento instrumentado | Métrica |
|---|---|---|
| Aquisição | `signup_started` | Visitantes → cadastro iniciado |
| Ativação | `signup_completed`, `onboarding_completed`, `route_created` | % que cria a primeira rota em 24h |
| Engajamento | `navigation_started`, `accommodation_viewed`, `translation_used`, `location_sharing_enabled`, `pilgrim_connected` | Funcionalidades usadas por sessão |
| Receita | `booking_click`, `premium_trial_started`, `subscription_completed` (compra do passe, com cupom) | Conversão free → passe, ticket médio, % de vendas via criadores |
| Retenção | `subscription_cancelled` (reembolso), `retention_d7`, `retention_d30` | Retenção D7/D30, reembolsos |
| Indicação | cartões e retrospectivas compartilhados, `?ref=` | Compartilhamentos por usuário, vendas por criador |

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
- **Camino Pass** de pagamento único, Grupo/Família, cupons de lançamento e de criadores (Stripe quando houver chave, simulação identificada sem chave).
- **Copiloto do dia** com regras transparentes ("por que esta sugestão?") e replanejamento automático ao encurtar uma etapa.
- **Camino Live:** contagens por etapa (com anonimato abaixo de 3 pessoas), idiomas, grupos saindo, relatos de condições que expiram em 12 h, convites em locais públicos.
- **Mundo 3D da jornada** (`/jornada`): região, hora local, clima, arco de chegada, broches de cada cidade, outros peregrinos com consentimento.
- **Cartões de etapa e retrospectiva** em imagem e vídeo curto, gerados no aparelho.
- **Rotas de criadores** e painel de afiliados; **parceiros fundadores** com ofertas separadas da lista orgânica.
- Painel administrativo: métricas, economia por venda, criadores, parceiros e moderação.
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
