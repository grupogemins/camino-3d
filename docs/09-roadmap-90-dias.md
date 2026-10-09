# 09. Roadmap de 90 dias

Meta do trimestre: 300 peregrinos reais usando o app no Caminho Português e 8% de conversão para o Passe do Caminho.

## Dias 1–30: do MVP ao piloto fechado
- Supabase em produção (auth por link mágico, perfil, viagem, diário) com RLS e região UE.
- Stripe real: Passe de EUR 10 + webhook; termos, política de privacidade e cookies revisados por advogado (RGPD).
- Plano comercial Open-Meteo + OpenRouteService; GPX oficial licenciado do Caminho Português.
- Deploy na Vercel (região UE) com domínio; Sentry; analytics com consentimento.
- 20 testes com peregrinos (grupos de WhatsApp/Facebook do Caminho), foco em J1 (planejar) e J3 (dia de caminhada).
- Indicador: 70% concluem o onboarding; NPS ≥ 40 no piloto.

## Dias 31–60: valor no caminho
- Hospedagens reais: 30 albergues parceiros cadastrados pelo admin, com preço e data informados por eles.
- Comunidade real com moderação (fila de denúncias, banimento) e notificações push (web push).
- Offline completo da etapa: mapa vetorial + POIs + frases.
- Capacitor: build iOS/Android interno (TestFlight / teste fechado) para validar GPS em segundo plano.
- Indicador: 40% dos usuários ativos abrem o app em 3+ dias da caminhada.

## Dias 61–90: crescimento e receita
- Lançamento público do Caminho Português; Francês em seguida (reaproveita a mesma estrutura de dados).
- Programa de parceiros: patrocínio rotulado para albergues e cafés, com painel de desempenho.
- Afiliados de seguro-viagem e transporte de mochila, com aviso.
- Loja de itens de personalização do peregrino 3D (cosméticos, sem afetar segurança).
- Publicação nas lojas (decidir IAP vs. venda web, ver riscos).
- Indicador: 300 viajantes ativos, 8% compram o Passe, CAC < EUR 4.

## Fora deste trimestre
Realidade aumentada nos marcos, rotas personalizadas por IA, integração com a credencial oficial (só com acordo institucional), modo família.
