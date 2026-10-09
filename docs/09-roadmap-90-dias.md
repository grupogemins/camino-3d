# 09. Roadmap de 90 dias

Meta do trimestre: lançar no **Caminho Francês** com a promessa central funcionando de ponta a ponta, 500 peregrinos reais ativos e uma base de criadores e parceiros fundadores que gere distribuição.

A promessa central que precisa estar pronta para lançar:
1. Criar a viagem e personalizar o peregrino 3D.
2. Receber etapas adaptadas ao perfil e sugestões do copiloto.
3. Navegar e baixar o essencial offline.
4. Encontrar hospedagem, comida, clima e cultura.
5. Ver a comunidade com controles de privacidade (Camino Live).
6. Registrar o progresso, compartilhar cartões e receber a retrospectiva ao chegar.

## Dias 1–30: base real no Caminho Francês
- Dados do Francês (Saint-Jean-Pied-de-Port → Santiago, ~780 km): paradas, traçado licenciado, regiões para o mundo 3D, lembranças por cidade.
- Supabase em produção (auth por link mágico, perfil, viagem, diário, compras) com RLS e região UE.
- Stripe real: Camino Pass EUR 14,99, Grupo/Família, cupom de lançamento EUR 9,99, webhook; termos, privacidade e reembolso revisados por advogado (RGPD e direito de consumo).
- Clima comercial (Open-Meteo) e roteamento; copiloto rodando com dados reais.
- Deploy na Vercel (região UE), Sentry, analytics com consentimento e funil por etapa.
- 10 criadores convidados (YouTube/Instagram de viagem e peregrinação): contrato, autorização de uso do nome, cupom e 2 rotas de criador publicadas.
- Indicador: 70% concluem o onboarding; 40% geram pelo menos um cartão de etapa.

## Dias 31–60: rede e memórias
- Camino Live real: contagem agregada por etapa, relatos com expiração e moderação, convites, notificações push.
- Retrospectiva final e vídeo curto testados em iOS e Android; modelo de cartão com marca discreta dos parceiros (com autorização).
- Programa de parceiros fundadores: 30 hospedagens e cafés no Francês, ofertas com cupom rastreável e painel de desempenho.
- Offline completo da etapa (mapa vetorial, POIs, frases).
- Capacitor: builds de teste iOS/Android para validar GPS em segundo plano.
- Indicador: 30% dos usuários ativos compartilham algo; 25% das vendas vêm de criadores.

## Dias 61–90: crescimento e receita
- Lançamento público no Francês com campanha de criadores (cupom de lançamento até 31/03/2027).
- Caminho Português como segundo passe (reaproveita a demonstração atual).
- Teste de preço: EUR 14,99 x EUR 19,99 no preço cheio, mantendo EUR 9,99 com cupom.
- Publicação nas lojas (decidir venda pela web x compra no app; ver riscos).
- Indicador: 500 viajantes ativos, 8% de conversão sobre visitas qualificadas ao checkout, sobra positiva por venda após comissão (aba Economia).

## Fora deste trimestre
Primitivo, Norte e outras peregrinações; realidade aumentada nos marcos; redação das sugestões do copiloto por IA (decisão continua em regras com fontes); integração com a credencial oficial só com acordo institucional.
